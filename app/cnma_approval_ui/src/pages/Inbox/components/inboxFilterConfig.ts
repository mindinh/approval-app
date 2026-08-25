import type { FilterFieldConfig } from '@/components/filterbar/types';

/**
 * Inbox Task Filter Configuration
 *
 * Defines all available filter fields for the inbox task list.
 * Follows the SAP UI5 FilterBar pattern from ai-agent-extraction.
 */

export const INBOX_FILTER_CONFIG: FilterFieldConfig[] = [
    {
        key: 'search',
        label: 'Request Search',
        type: 'text',
        placeholder: 'Search by title, requestor...',
        visible: true,
    },
    {
        key: 'priority',
        label: 'Priority',
        type: 'multiselect',
        placeholder: 'All Priority',
        visible: true,
        options: [
            { value: 'VERY_HIGH', label: 'Very High' },
            { value: 'HIGH', label: 'High' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'LOW', label: 'Low' },
        ],
        showSelectAll: true,
    },
    {
        key: 'documentType',
        label: 'Document Type',
        type: 'multiselect',
        placeholder: 'All Types',
        visible: true,
        options: [
            { value: 'Asset PR', label: 'Asset PR' },
            { value: 'Expense PR', label: 'Expense PR' },
            { value: 'Marketing PR', label: 'Marketing PR' },
            { value: 'Trading PR', label: 'Trading PR' },
            { value: 'Non-Trade PR', label: 'Non-Trade PR' },
            { value: 'Tools PR', label: 'Tools PR' },
            { value: 'Asset PO', label: 'Asset PO' },
            { value: 'Consignment PO', label: 'Consignment PO' },
            { value: 'Consignment Return PO', label: 'Consignment Return PO' },
            { value: 'Expense PO', label: 'Expense PO' },
            { value: 'Marketing PO', label: 'Marketing PO' },
            { value: 'Trading PO', label: 'Trading PO' },
            { value: 'Non-Trade PO', label: 'Non-Trade PO' },
            { value: 'Trading Return PO', label: 'Trading Return PO' },
            { value: 'Tools PO', label: 'Tools PO' },
            { value: 'Stock Transport Order', label: 'Stock Transport Order' },
            { value: 'Reservation', label: 'Reservation' },
            { value: 'Claim', label: 'Claim' },
        ],
        showSelectAll: true,
    },
    {
        key: 'normalTask',
        label: 'Task Type',
        type: 'select',
        placeholder: 'All Types',
        visible: true,
        options: [
            { value: 'NORMAL', label: 'Standard Approval' },
            { value: 'TAGGED', label: 'CC' },
        ],
    },
    {
        key: 'createdDate',
        label: 'Created Date',
        type: 'dateRange',
        visible: true,
    },
];
