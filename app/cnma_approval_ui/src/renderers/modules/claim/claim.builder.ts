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

export function buildClaimModel(detail: TaskDetail): BusinessSectionModel {
    const attrIndex = createAttributeIndex(detail.customAttributes);

    const documentId =
        detail.documentId ||
        detail.businessContext?.documentId ||
        pickByAlias(attrIndex, 'documentId') ||
        (detail.taskObjects && detail.taskObjects[0]?.objectId);

    const netValue =
        (detail.total != null ? String(detail.total) : undefined) ||
        pickByAlias(attrIndex, 'netValue') ||
        (detail.task?.total != null ? String(detail.task.total) : undefined);

    const currency =
        detail.currency ||
        pickByAlias(attrIndex, 'currency') ||
        detail.task?.curr_vnd;

    const formattedTotal = netValue ? formatAmount(netValue, currency) : EMPTY_VALUE;

    const overviewFields = [
        field('Claim Form Number', documentId),
        field('Document Type', detail.documentTypeDisplay || (detail.documentType ? detail.documentType : EMPTY_VALUE)),
        field('Claimant Name', detail.requestorName || detail.header?.userFullName),
        field('Created On', formatDate(detail.createdOn || detail.header?.createdOn)),
        field('Total Amount', formattedTotal),
        field('Company Code', formatCodeWithText(detail.companyCode || detail.header?.companyCode, detail.companyCodeDisplay || detail.header?.companyCodeDisplay)),
        field('Purpose / Reason', detail.headerNote || detail.header?.purpose),
        field('Paid By', detail.header?.paidBy),
        field('Bank Details', detail.header?.bankDetails),
    ];

    const tables: DetailTableModel[] = [];
    if (detail.customAttributes && detail.customAttributes.length > 0) tables.push(buildCustomAttributesTable(detail.customAttributes));
    if (detail.taskObjects && detail.taskObjects.length > 0) tables.push(buildTaskObjectsTable(detail.taskObjects));

    return {
        title: 'Claim Form Details',
        subtitle: documentId ? `Claim ${documentId}` : 'Claim details',
        cards: [
            {
                id: 'claim-summary',
                title: 'Overview',
                fields: overviewFields,
            },
        ],
        tables,
    };
}
