import { BaseDetail, toCamelCaseKeys } from './base';
import { ObjectTypeCode } from '../processors/object-config';
import { ODATA_SERVICES } from '../processors/odata-config';
import { RawODataEntity } from '../types/sap-odata.types';
import { AppError } from '../utils/error-handler';
import { getMimeTypeFromExtension } from '../utils/mime';

export class PoDetail extends BaseDetail {
    readonly objectType: ObjectTypeCode = 'PO';

    protected async fetchSubEntities(
        objectId: string,
        paddedId: string,
        rawHeader: RawODataEntity,
        normalizedHeader: any,
        sapUser: string,
        userJwt?: string
    ): Promise<Record<string, any>> {
        const servicePath = ODATA_SERVICES.INSTANCE_LIST.servicePath;

        // Retrieve expanded collections from rawHeader (provided by $expand on the main request)
        const rawItems = rawHeader._Item || [];
        const rawSteps = rawHeader._ApprovalStep || [];
        const rawTexts = rawHeader._HeaderText || [];

        // Normalize raw items using metadata service
        const normalizedRawItems = await Promise.all(rawItems.map((item: any) => 
            this.metadataService.normalizeDetail(item, servicePath, sapUser, userJwt)
        ));

        const normalizedItems = normalizedRawItems;

        // Normalize workflow approval steps
        const normalizedSteps = rawSteps.map((s: any) => ({
            documentId: s.ObjectKey || objectId,
            level: Number(s.ApprovalLevel ?? 0),
            releaseCode: s.ReleaseCode || '',
            releaseText: s.ReleaseText || s.ReleaseCode || '',
            approver: s.ApproverName || '',
            approverUserId: s.ApproverUserId || '',
            status: s.ApprovalStatus || '',
            noteText: s.CommentText || '',
            postedOn: s.CommentDate || '',
            postedTime: s.CommentTime || ''
        }));

        // Derive PO description from first text element or join them
        const poDescription = rawTexts.map((t: any) => t.LongText || '').join('\n').replace(/\n{3,}/g, '\n\n').trim();

        // Derive account assignments from items with cost centers to preserve compatibility
        const accountAssignments = normalizedRawItems
            .filter((item: any) => item.CostCenter || item.GLAccount)
            .map((item: any) => ({
                purchaseOrder: objectId,
                purchaseOrderItem: item.ItemNumber,
                accountAssignmentNumber: item.AccountAssignmentNumber || item.ItemNumber || '',
                distributionPercentage: item.DistributionPercentage || '',
                glAccount: item.GLAccount || '',
                glAccountText: item.GLAccountDescription || '',
                costCenter: item.CostCenter || '',
                costCenterText: item.CostCenterDescription || '',
                companyCode: item.CompanyCode || normalizedHeader.CompanyCode || '',
                netAmount: String(item.NetAmount || '0'),
                documentCurrency: item.DocumentCurrency || normalizedHeader.DocumentCurrency || ''
            }));

        // Normalize comments from _Comment navigation property
        const rawComments = rawHeader._Comment || [];
        const normalizedRawComments = await Promise.all(rawComments.map((c: any) =>
            this.metadataService.normalizeDetail(c, servicePath, sapUser, userJwt)
        ));

        const normalizedComments = normalizedRawComments.map((c: any) => ({
            author: c.UserComment || '',
            text: c.NoteText || '',
            postedOn: c.PostedOn || '',
            postedTime: c.PostedTime || ''
        }));

        // Normalize attachments from _Attachment navigation property
        const rawAttachments = rawHeader._Attachment || [];
        const normalizedAttachments = rawAttachments.map((att: any) => {
            const ext = att.FileExtension || '';
            let fileName = att.FileName || '';
            if (ext && !fileName.toLowerCase().endsWith('.' + ext.toLowerCase())) {
                fileName = `${fileName}.${ext}`;
            }
            const mimeType = att.MimeType || att.ContentType || getMimeTypeFromExtension(ext, fileName);
            return {
                id: att.DocId,
                fileName,
                fileDisplayName: att.FileName,
                mimeType,
                fileSize: Number(att.Length || 0),
                createdBy: att.CreatedBy || '',
                createdAt: att.CreatedOnDate && att.CreatedOnTime ? `${att.CreatedOnDate}T${att.CreatedOnTime}` : new Date().toISOString()
            };
        });

        const finalHeader = {
            ...toCamelCaseKeys(normalizedHeader),
            purchaseOrder: objectId,
            purchaseOrderText: poDescription
        };

        return {
            header: finalHeader,
            items: toCamelCaseKeys(normalizedItems),
            accountAssignments: toCamelCaseKeys(accountAssignments),
            scheduleLines: [], // Not supported in this OData V4 service
            approvalTree: normalizedSteps,
            comments: normalizedComments,
            attachments: normalizedAttachments
        };
    }

    async addComment(objectId: string, text: string, sapUser: string, userJwt?: string, type = 'NORM'): Promise<void> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            return; // Mock commented operations done at PR level or mock provider
        }
        throw new AppError('Comments posting is disabled for this service.', 405);
    }
}
