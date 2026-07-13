import { BaseDetail, toCamelCaseKeys } from './base';
import { ObjectTypeCode } from '../processors/object-config';
import { ODATA_DETAIL_CONFIGS, ODATA_SERVICES } from '../processors/odata-config';
import { ODataV4Result, RawODataEntity } from '../types/sap-odata.types';
import { decodeAttachmentContent } from '../utils/file-helper';
import { addMockComment, addMockAttachment, getMockAttachmentContent } from './mock-data-provider';

export class PrDetail extends BaseDetail {
    readonly objectType: ObjectTypeCode = 'PR';

    protected async fetchSubEntities(
        objectId: string,
        paddedId: string,
        rawHeader: RawODataEntity,
        normalizedHeader: any,
        sapUser: string,
        userJwt?: string
    ): Promise<Record<string, any>> {
        const config = ODATA_DETAIL_CONFIGS[this.objectType];
        const unpaddedId = objectId.replace(/^0+/, '');
        const escapedUnpaddedPr = encodeURIComponent(unpaddedId);
        const v4Path = ODATA_SERVICES.INSTANCE_LIST.servicePath;

        const [itemsRes, treeRes, commentsRes, infoRes, attachRes] = await Promise.all([
            this.sapClient.get<ODataV4Result>(v4Path, config.itemsEntity!, { $filter: `PurchaseRequisition eq '${escapedUnpaddedPr}'` }, sapUser, userJwt).catch((err) => {
                console.error(`[PrDetail] Failed to fetch PR items:`, err.message);
                return { value: [] };
            }),
            this.sapClient.get<ODataV4Result>(v4Path, config.approvalTreeEntity!, { $filter: `PurchaseRequisition eq '${escapedUnpaddedPr}'` }, sapUser, userJwt).catch((err) => {
                console.error(`[PrDetail] Failed to fetch approval tree:`, err.message);
                return { value: [] };
            }),
            this.sapClient.get<ODataV4Result>(v4Path, config.commentsEntity!, { $filter: `PurchaseRequisition eq '${escapedUnpaddedPr}'` }, sapUser, userJwt).catch((err) => {
                console.error(`[PrDetail] Failed to fetch comments:`, err.message);
                return { value: [] };
            }),
            this.sapClient.get<ODataV4Result>(v4Path, '/ZI_PR_INFO', { $filter: `PurchaseRequisition eq '${escapedUnpaddedPr}'` }, sapUser, userJwt).catch((err) => {
                console.error(`[PrDetail] Failed to fetch PR info:`, err.message);
                return { value: [] };
            }),
            this.sapClient.get<ODataV4Result>(v4Path, config.attachmentsEntity!, { $filter: `PurchaseRequisition eq '${escapedUnpaddedPr}'` }, sapUser, userJwt).catch((err) => {
                console.error(`[PrDetail] Failed to fetch PR attachments:`, err.message);
                return { value: [] };
            })
        ]);

        const rawItems = itemsRes?.value || [];
        const rawSteps = treeRes?.value || [];
        const rawComments = commentsRes?.value || [];
        const rawInfo = infoRes?.value || [];
        const rawAttach = attachRes?.value || [];

        // Normalize raw items
        const normalizedRawItems = await Promise.all(rawItems.map((item) => 
            this.metadataService.normalizeDetail(item, config.servicePath, sapUser, userJwt)
        ));

        const normalizedItems = normalizedRawItems.map((item: any) => 
            this.mapItemProperties(item, config.itemMapper!)
        );

        // Normalize steps, comments, attachments
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

        // Read specific custom header info and merge description
        const infoHeader = rawInfo[0] || {};
        const costCenter = infoHeader.CostCenter || '';
        const wbsElement = infoHeader.WBSElement || '';
        const prDescription = Array.isArray(infoHeader.Description)
            ? (infoHeader.Description[0]?.TextLine || '')
            : (infoHeader.Description?.TextLine || '');

        const finalHeader = {
            ...toCamelCaseKeys(normalizedHeader),
            purchaseRequisitionText: prDescription
        };

        return {
            header: finalHeader,
            items: toCamelCaseKeys(normalizedItems),
            budget: { status: 'OK' },
            asset: { assetClass: 'IT Equipment' },
            approvalTree: normalizedSteps,
            comments: normalizedComments,
            attachments: normalizedAttachments,
            costCenter,
            wbsElement
        };
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
