import type { TaskDetail } from '@/services/inbox/inbox.types';
import type { BusinessSectionModel, DetailTableModel } from '../../TaskDetailSections.types';
import { EMPTY_VALUE, formatAmount, formatDate, formatCodeWithText } from '../../shared/formatters';
import {
    buildCustomAttributesTable,
    buildTaskObjectsTable,
    createAttributeIndex,
    field,
    pickByAlias
} from '../../shared/base.builder';

export function buildReservationModel(detail: TaskDetail): BusinessSectionModel {
    const attrIndex = createAttributeIndex(detail.customAttributes);

    const documentId =
        detail.documentId ||
        detail.businessContext?.documentId ||
        pickByAlias(attrIndex, 'documentId') ||
        (detail.taskObjects && detail.taskObjects[0]?.objectId);

    const overviewFields = [
        field('Reservation Number', documentId),
        field('Document Type', detail.documentTypeDisplay || (detail.documentType ? detail.documentType : EMPTY_VALUE)),
        field('Requester', detail.requestorName || detail.header?.userFullName),
        field('Created On', formatDate(detail.createdOn || detail.header?.createdOn)),
        field('Cost Center', formatCodeWithText(detail.header?.costCenter, detail.header?.costCenterName)),
        field('Goods Recipient', detail.header?.goodsRecipient),
        field('Header Note', detail.headerNote || detail.header?.purchaseOrderText || detail.header?.purchaseRequisitionText),
    ];

    const tables: DetailTableModel[] = [];
    if (detail.customAttributes && detail.customAttributes.length > 0) tables.push(buildCustomAttributesTable(detail.customAttributes));
    if (detail.taskObjects && detail.taskObjects.length > 0) tables.push(buildTaskObjectsTable(detail.taskObjects));

    return {
        title: 'Reservation Details',
        subtitle: documentId ? `Reservation ${documentId}` : 'Reservation details',
        cards: [
            {
                id: 'reservation-summary',
                title: 'Overview',
                fields: overviewFields,
            },
        ],
        tables,
    };
}
