import { SapClient } from './sap-client';
import { MetadataService } from '../metadata-service';
import { DetailStrategy } from './detail-strategy';
import { ObjectTypeCode } from '../processors/object-config';
import { ODATA_SERVICES } from '../processors/odata-config';
import { getMockDetail, addMockComment, addMockAttachment, getMockAttachmentContent } from './mock-data-provider';
import { RawODataEntity, ODataSingleResult, ODataV4Result } from '../types/sap-odata.types';
import { decodeAttachmentContent } from '../utils/file-helper';

function toCamelCaseKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => toCamelCaseKeys(item));
    }
    const result: any = {};
    for (const key of Object.keys(obj)) {
        const normalizedKey = key.replace(/_Text$/, 'Text');
        const camelKey = normalizedKey.charAt(0).toLowerCase() + normalizedKey.slice(1);
        result[camelKey] = toCamelCaseKeys(obj[key]);
    }
    return result;
}

export class PrStrategy implements DetailStrategy {
    readonly objectType: ObjectTypeCode = 'PR';
    private readonly metadataService: MetadataService;

    constructor(private readonly sapClient: SapClient) {
        this.metadataService = new MetadataService(this.sapClient);
    }

    async getDetail(objectId: string, sapUser: string, userJwt?: string, headerOnly = false): Promise<any> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';

        if (isMockMode) {
            const mock = getMockDetail(this.objectType, objectId);
            if (headerOnly) {
                return {
                    objectType: mock.objectType,
                    documentType: mock.documentType,
                    objectId: mock.objectId,
                    header: toCamelCaseKeys(mock.header)
                };
            }
            return {
                ...mock,
                header: toCamelCaseKeys(mock.header),
                items: toCamelCaseKeys(mock.items)
            };
        }

        const path = '/sap/opu/odata/SAP/C_PURREQUISITION_FS_SRV';
        const paddedId = /^\d+$/.test(objectId) ? objectId.padStart(10, '0') : objectId;
        const headerUrl = `/C_PurRequisitionFs('${encodeURIComponent(paddedId)}')`;

        if (headerOnly) {
            const headerRes = await this.sapClient.get<ODataSingleResult>(path, headerUrl, { $format: 'json' }, sapUser, userJwt).catch(() => null);
            const rawHeader = headerRes?.d || {} as RawODataEntity;
            const normalizedHeader = await this.metadataService.normalizeDetail(rawHeader, path, sapUser, userJwt);
            return {
                objectType: 'PR',
                documentType: rawHeader.PurchaseRequisitionType || 'ZASS',
                objectId,
                header: toCamelCaseKeys(normalizedHeader)
            };
        }

        const unpaddedId = objectId.replace(/^0+/, '');
        const escapedUnpaddedPr = unpaddedId.replace(/'/g, "''");

        const v4Path = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const escapedPr = paddedId.replace(/'/g, "''");

        const [headerRes, itemsRes, treeRes, commentsRes, infoRes, attachRes] = await Promise.all([
            this.sapClient.get<ODataSingleResult>(path, headerUrl, { $format: 'json' }, sapUser, userJwt).catch((err) => {
                console.error(`[PrStrategy] Failed to fetch PR header for ${paddedId}:`, err.message);
                return null;
            }),
            this.sapClient.get<ODataV4Result>(v4Path, '/ZC_PR_CUSTOM', { $filter: `PurchaseRequisition eq '${escapedUnpaddedPr}'` }, sapUser, userJwt).catch((err) => {
                console.error(`[PrStrategy] Failed to fetch PR items from ZC_PR_CUSTOM for ${unpaddedId}:`, err.message);
                return { value: [] };
            }),
            this.sapClient.get<ODataV4Result>(v4Path, '/ZI_PR_APPROVAL_LINE', { $filter: `Banfn eq '${escapedPr}'` }, sapUser, userJwt).catch((err) => {
                console.error(`[PrStrategy] Failed to fetch PR approval line for ${paddedId}:`, err.message);
                return { value: [] };
            }),
            this.sapClient.get<ODataV4Result>(v4Path, '/ZI_PR_COMMENT_TAB', { $filter: `DocNum eq '${escapedPr}'` }, sapUser, userJwt).catch((err) => {
                console.error(`[PrStrategy] Failed to fetch PR comments for ${paddedId}:`, err.message);
                return { value: [] };
            }),
            this.sapClient.get<ODataV4Result>(v4Path, '/ZI_PR_INFO', { $filter: `Banfn eq '${escapedPr}'`, $expand: 'Description' }, sapUser, userJwt).catch((err) => {
                console.error(`[PrStrategy] Failed to fetch PR info for ${paddedId}:`, err.message);
                return { value: [] };
            }),
            this.sapClient.get<ODataV4Result>(v4Path, '/ZI_PR_ATTACHMENTS', { $filter: `doc_num eq '${escapedPr}'`, $select: 'attach_id,file_name,mime_type,file_size,created_by,created_on,created_time' }, sapUser, userJwt).catch((err) => {
                console.error(`[PrStrategy] Failed to fetch PR attachments for ${paddedId}:`, err.message);
                return { value: [] };
            })
        ]);

        const rawHeader = headerRes?.d || {} as RawODataEntity;
        const rawItems = itemsRes?.value || [];
        const rawSteps = treeRes?.value || [];
        const rawComments = commentsRes?.value || [];
        const infoRows = infoRes?.value || [];
        const rawAttach = attachRes?.value || [];

        let descriptionText = '';
        if (infoRows.length > 0) {
            const prInfo = infoRows[0];
            const descriptionLines = prInfo.Description || [];
            descriptionText = descriptionLines.map((row: any) => row.TextLine || '').join('\n').trim();
            if (prInfo.Frgxt) {
                rawHeader.ReleaseStrategyName = prInfo.Frgxt;
            }
        }

        const normalizedHeader = await this.metadataService.normalizeDetail(rawHeader, path, sapUser, userJwt);
        if (descriptionText) {
            normalizedHeader.PurchaseRequisitionText = descriptionText;
        }

        const normalizedRawItems = await Promise.all(rawItems.map((i) => this.metadataService.normalizeDetail(i, v4Path, sapUser, userJwt)));
        const normalizedItems = normalizedRawItems.map((item: any) => {
            const calculatedTotal = Number(item.Price || 0) * Number(item.Quantity || 0);
            const itemTotal = item.NetValueDocCrcy !== undefined && item.NetValueDocCrcy !== null && Number(item.NetValueDocCrcy) !== 0
                ? String(item.NetValueDocCrcy)
                : String(calculatedTotal);

            return {
                purchaseRequisition: item.PurchaseRequisition,
                purchaseRequisitionItem: item.PRItem,
                purchaseRequisitionItemText: item.MaterialDescription || `Item ${item.PRItem} (${item.Material || 'Service'})`,
                material: item.Material || '',
                materialGroup: item.MaterialGroup || '',
                materialGroupText: item.MaterialGroupText || '',
                requestedQuantity: String(item.Quantity || '0'),
                baseUnit: item.QuantityUnit || 'PC',
                purchaseRequisitionPrice: String(item.Price || '0'),
                purReqnItemCurrency: item.DocumentCurrency || 'VND',
                purReqnItemTotalAmount: itemTotal,
                deliveryDate: item.DeliveryDate || new Date().toISOString(),
                plant: item.Plant || '',
                costCenter: item.CostCenter || '',
                costCenterDescription: item.CostCenterDescription || '',
                commitmentItem: item.CommitmentItem || '',
                documentType: item.DocumentType || '',
                priceUnit: item.PriceUnit,
                netValueLocalCrcy: item.NetValueLocalCrcy,
                localCrcy: item.LocalCrcy,
                netValueDocCrcy: item.NetValueDocCrcy
            };
        });

        const normalizedSteps = rawSteps.map((s) => ({
            prNumber: s.Banfn,
            level: Number(s.Lvl),
            releaseCode: s.FrgCode,
            approver: s.Approver,
            approverUserId: s.Usr,
            status: s.Status,
            noteText: s.NoteText,
            postedOn: s.PostedOn,
            postedTime: s.PostedTime
        }));

        const normalizedComments = rawComments.map((c) => ({
            author: c.UserComment,
            text: c.NoteText,
            postedOn: c.PostedOn,
            postedTime: c.PostedTime
        }));

        const normalizedAttachments = rawAttach.map((a) => ({
            id: a.attach_id,
            fileName: a.file_name,
            mimeType: a.mime_type,
            fileSize: a.file_size,
            createdBy: a.created_by,
            createdAt: a.created_on ? `${a.created_on}T${a.created_time || '00:00:00'}` : undefined
        }));

        return {
            objectType: 'PR',
            documentType: rawHeader.PurchaseRequisitionType || 'ZASS',
            objectId,
            header: toCamelCaseKeys(normalizedHeader),
            items: toCamelCaseKeys(normalizedItems),
            budget: { status: 'OK' },
            asset: { assetClass: 'IT Equipment' },
            approvalTree: normalizedSteps,
            comments: normalizedComments,
            attachments: normalizedAttachments
        };
    }

    async getDetailBatch(
        itemsToFetch: Array<{ objectType: string; objectId: string }>,
        sapUser: string,
        userJwt?: string
    ): Promise<Record<string, any>> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        const results: Record<string, any> = {};

        if (isMockMode) {
            for (const item of itemsToFetch) {
                const mock = getMockDetail(this.objectType, item.objectId);
                results[`${this.objectType}:${item.objectId}`] = {
                    objectType: mock.objectType,
                    documentType: mock.documentType,
                    objectId: item.objectId,
                    header: toCamelCaseKeys(mock.header)
                };
            }
            return results;
        }

        const path = '/sap/opu/odata/SAP/C_PURREQUISITION_FS_SRV';
        const batchRequests = itemsToFetch.map(item => {
            const paddedId = /^\d+$/.test(item.objectId) ? item.objectId.padStart(10, '0') : item.objectId;
            return {
                relativePath: `/C_PurRequisitionFs('${encodeURIComponent(paddedId)}')`,
                params: {}
            };
        });

        try {
            const batchResponses = await this.sapClient.batchGet(path, batchRequests, sapUser, userJwt);
            for (let idx = 0; idx < itemsToFetch.length; idx++) {
                const item = itemsToFetch[idx];
                const responsePart = batchResponses[idx];
                
                let normalizedHeader = {};
                let docType = 'ZASS';
                
                if (responsePart && !responsePart.error) {
                    const rawHeader = (responsePart.d || responsePart) as RawODataEntity;
                    docType = rawHeader.PurchaseRequisitionType || 'ZASS';
                    normalizedHeader = await this.metadataService.normalizeDetail(rawHeader, path, sapUser, userJwt);
                }
                
                results[`PR:${item.objectId}`] = {
                    objectType: 'PR',
                    documentType: docType,
                    objectId: item.objectId,
                    header: toCamelCaseKeys(normalizedHeader)
                };
            }
        } catch (err: any) {
            console.error('[PrStrategy] Batch header fetch failed, falling back to sequential calls:', err.message);
            for (const item of itemsToFetch) {
                try {
                    const single = await this.getDetail(item.objectId, sapUser, userJwt, true);
                    results[`PR:${item.objectId}`] = single;
                } catch (singleErr) {
                    // ignore
                }
            }
        }

        return results;
    }

    async addComment(objectId: string, text: string, sapUser: string, userJwt?: string, type = 'NORM'): Promise<void> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            addMockComment(objectId, text, sapUser);
            return;
        }

        const v4Path = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const paddedId = /^\d+$/.test(objectId) ? objectId.padStart(10, '0') : objectId;
        const escapedPr = paddedId.replace(/'/g, "''");

        await this.sapClient.post(
            v4Path,
            `/ZI_PR_COMMENT(Banfn='${escapedPr}')/SAP__self.Comment`,
            { NoteText: text, Type: type },
            { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            sapUser,
            userJwt
        );
    }

    async uploadAttachment(objectId: string, fileName: string, mimeType: string, buffer: Buffer, sapUser: string, userJwt?: string): Promise<void> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            addMockAttachment(objectId, fileName, mimeType, buffer, sapUser);
            return;
        }

        const v4Path = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const paddedId = /^\d+$/.test(objectId) ? objectId.padStart(10, '0') : objectId;
        const escapedPr = paddedId.replace(/'/g, "''");

        const fileContentBase64 = buffer.toString('base64');
        const payload = {
            File_Name: fileName,
            Mime_Type: mimeType,
            File_Content: fileContentBase64,
            File_Size: buffer.byteLength
        };

        await this.sapClient.post(
            v4Path,
            `/ZI_PR_ATTACH_TAB(doc_num='${escapedPr}')/SAP__self.upload`,
            payload,
            { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            sapUser,
            userJwt
        );
    }

    async fetchAttachmentContent(objectId: string, attachId: string, sapUser: string, userJwt?: string): Promise<{ data: Buffer; contentType: string; fileName: string } | null> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            return getMockAttachmentContent(objectId, attachId);
        }

        const v4Path = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const paddedId = /^\d+$/.test(objectId) ? objectId.padStart(10, '0') : objectId;
        const escapedPr = paddedId.replace(/'/g, "''");
        const escapedAttachId = attachId.replace(/'/g, "''");

        const response: any = await this.sapClient.get(
            v4Path,
            '/ZI_PR_ATTACHMENTS',
            {
                $filter: `doc_num eq '${escapedPr}' and attach_id eq ${escapedAttachId}`,
                $select: 'file_content,file_name,mime_type'
            },
            sapUser,
            userJwt
        );

        const items = response?.value || [];
        const attachment = items[0];
        if (!attachment || !attachment.file_content) {
            return null;
        }

        const buffer = decodeAttachmentContent(attachment.file_content);

        return {
            data: buffer,
            contentType: attachment.mime_type || 'application/octet-stream',
            fileName: attachment.file_name || 'attachment.pdf'
        };
    }
}
