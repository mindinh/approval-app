import { SapClient } from './sap-client';
import { MetadataService } from '../metadata-service';
import { Detail, ForwardOnHeaderParams } from './detail';
import { ObjectTypeCode } from '../processors/object-config';
import { ODATA_SERVICES } from '../processors/odata-config';
import { AppError } from '../utils/error-handler';
import { AddCommentOptions } from './comment.types';

export interface RawDetailSource {
    objectType: ObjectTypeCode;
    aliases: readonly string[];
    entity: string;
    docCategory: string;
    navigations: readonly string[];
}

export interface CommentPayload {
    TASKID: string;
    NOTETEXT: string;
    ISGENERAL: boolean;
    DECISION: string;
    TAGGEDUSER: Array<{ USERNAME: string; EMAIL: string }>;
    FORWARD: boolean;
}

export interface ForwardPayload {
    task_id: string;
    notetext: string;
    to_user: string;
}

export abstract class BaseRawDetail implements Detail {
    abstract readonly source: RawDetailSource;

    get objectType(): ObjectTypeCode {
        return this.source.objectType;
    }

    constructor(
        protected readonly sapClient: SapClient,
        protected readonly metadataService: MetadataService
    ) {}

    /**
     * Single source of truth for the `/SAP__self.comment` body.
     * Used by every strategy (PR / PO / RE / CLAIM) so a payload tweak lands in one place.
     */
    protected buildCommentPayload(text: string, options?: AddCommentOptions): CommentPayload {
        const cleanText = text ? text.trim().substring(0, 255) : '';
        const isDecisionComment = Boolean(options?.decision && options.decision.trim());
        const taskId = options?.taskId ? options.taskId.trim().substring(0, 12) : '';
        const taggedUsers = (options?.taggedUsers || []).map((u) => ({
            USERNAME: String(u.USERNAME || '').trim().substring(0, 12),
            EMAIL: String(u.EMAIL || '').trim().substring(0, 241),
        }));

        return {
            TASKID: taskId,
            NOTETEXT: cleanText,
            ISGENERAL: !isDecisionComment,
            DECISION: isDecisionComment ? (options!.decision || '').trim() : '',
            TAGGEDUSER: taggedUsers,
            FORWARD: false,
        };
    }

    /**
     * Builds the body for the entity-bound `/SAP__self.forward` action.
     */
    protected buildForwardPayload(params: ForwardOnHeaderParams): ForwardPayload {
        return {
            task_id: params.taskId.trim().substring(0, 12),
            notetext: (params.notetext || '').trim().substring(0, 255),
            to_user: (params.toUser || '').trim().substring(0, 12),
        };
    }

    /**
     * Pads a numeric document id to 10 chars (SAP key width) and slices in case it overflows.
     * Non-numeric ids pass through unchanged.
     */
    protected padDocumentId(objectId: string): string {
        const rawPadded = /^\d+$/.test(objectId) ? objectId.padStart(10, '0') : objectId;
        return rawPadded.substring(0, 10);
    }

    protected cleanRawEntity(entity: any): any {
        if (entity === null || typeof entity !== 'object') return entity;
        if (Array.isArray(entity)) {
            return entity.map(item => this.cleanRawEntity(item));
        }
        const cleaned: Record<string, any> = {};
        for (const key of Object.keys(entity)) {
            if (key === '__metadata' || key === '__deferred' || key === '@odata.context') {
                continue;
            }
            const val = entity[key];
            if (val && typeof val === 'object') {
                if (Array.isArray(val)) {
                    cleaned[key] = val.map(item => this.cleanRawEntity(item));
                } else if (val.results && Array.isArray(val.results)) {
                    cleaned[key] = val.results.map((item: any) => this.cleanRawEntity(item));
                } else if (val.d && Array.isArray(val.d.results)) {
                    cleaned[key] = val.d.results.map((item: any) => this.cleanRawEntity(item));
                } else {
                    cleaned[key] = this.cleanRawEntity(val);
                }
            } else {
                cleaned[key] = val;
            }
        }
        return cleaned;
    }

    async getDetail(
        objectId: string,
        sapUser: string,
        userJwt?: string,
        headerOnly = false
    ): Promise<any> {
        if (!objectId) {
            throw new Error('Document ID is required but was not provided');
        }

        const servicePath = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const rawPadded = /^\d+$/.test(objectId) ? objectId.padStart(10, '0') : objectId;
        const paddedId = rawPadded.substring(0, 10);
        const headerUrl = `/${this.source.entity}(DocCategory='${this.source.docCategory}',DocumentNumber='${encodeURIComponent(paddedId)}')`;

        const params: Record<string, string> = { $format: 'json' };
        if (!headerOnly && this.source.navigations.length > 0) {
            params.$expand = this.source.navigations.join(',');
        }

        let headerRes: any = null;
        try {
            headerRes = await this.sapClient.get<any>(
                servicePath,
                headerUrl,
                params,
                sapUser,
                userJwt
            );
        } catch (err: any) {
            if (params.$expand) {
                console.warn(`[BaseRawDetail:${this.source.objectType}] $expand failed for ${paddedId} (${err.message}). Retrying header-only query...`);
                headerRes = await this.sapClient.get<any>(
                    servicePath,
                    headerUrl,
                    { $format: 'json' },
                    sapUser,
                    userJwt
                ).catch((fallbackErr: any) => {
                    throw new AppError(`Failed to fetch header for ${this.source.objectType} ${paddedId}: ${fallbackErr.message}`, 404);
                });
            } else {
                throw new AppError(`Failed to fetch header for ${this.source.objectType} ${paddedId}: ${err.message}`, 404);
            }
        }

        const rawHeader = headerRes?.d || headerRes;
        if (!rawHeader || Object.keys(rawHeader).length === 0) {
            throw new AppError(`Failed to fetch header for ${this.source.objectType} ${paddedId}: Empty response received`, 404);
        }

        const cleaned = this.cleanRawEntity(rawHeader);

        if (!headerOnly && params.$expand) {
            const missingNavs = this.source.navigations.filter(nav => {
                const navKey = nav.replace(/\(.*\)/, '').trim();
                return cleaned[navKey] === undefined || cleaned[navKey] === null;
            });
            if (missingNavs.length > 0) {
                await Promise.all(
                    missingNavs.map(async (nav) => {
                        const navKey = nav.replace(/\(.*\)/, '').trim();
                        const queryParams: Record<string, string> = { $format: 'json' };

                        const match = nav.match(/\(([^)]+)\)/);
                        if (match && match[1]) {
                            const innerOptions = match[1].split(';');
                            for (const option of innerOptions) {
                                const [optKey, optVal] = option.split('=');
                                if (optKey && optVal) {
                                    queryParams[optKey.trim()] = optVal.trim();
                                }
                            }
                        }

                        try {
                            const res: any = await this.sapClient.get(
                                servicePath,
                                `${headerUrl}/${navKey}`,
                                queryParams,
                                sapUser,
                                userJwt
                            );
                            const val = res?.value || res?.d?.results || res?.d || [];
                            cleaned[navKey] = Array.isArray(val) ? val.map(item => this.cleanRawEntity(item)) : this.cleanRawEntity(val);
                        } catch {
                            cleaned[navKey] = [];
                        }
                    })
                );
            }
        }

        return cleaned;
    }

    async getDetailBatch(
        itemsToFetch: Array<{ objectType: string; objectId: string }>,
        sapUser: string,
        userJwt?: string
    ): Promise<Record<string, any>> {
        const results: Record<string, any> = {};

        await Promise.all(
            itemsToFetch.map(async (item) => {
                try {
                    const detail = await this.getDetail(item.objectId, sapUser, userJwt);
                    results[item.objectId] = detail;
                } catch {
                    results[item.objectId] = null;
                }
            })
        );
        return results;
    }
}
