import { describe, it, expect } from 'vitest';
import { resolveBusinessSectionModel } from '@/pages/Inbox/components/renderers/TaskDetailSections.registry';
import type { TaskDetail } from '@/services/inbox/inbox.types';

describe('resolveBusinessSectionModel with dynamic schema', () => {
    it('falls back to static renderer when fieldSchema or uiSchema is missing', () => {
        const detail: TaskDetail = {
            task: {
                instanceId: 'task-1',
                title: 'Test Task',
                status: 'READY',
                supports: { forward: true, comments: true },
            },
            decisions: [],
            customAttributes: [],
            taskObjects: [],
            comments: [],
            attachments: [],
            processingLogs: [],
            workflowLogs: [],
            businessContext: {
                type: 'PR',
                documentId: '10001',
                pr: {
                    header: { purchaseRequisition: '10001' },
                    items: [],
                },
            },
        };

        const result = resolveBusinessSectionModel(detail);
        expect(result.title).toBe('PR Business Data');
        expect(result.subtitle).toBe('Document 10001');
    });

    it('renders dynamically using fieldSchema and uiSchema when provided', () => {
        const detail: TaskDetail = {
            task: {
                instanceId: 'task-1',
                title: 'Test Dynamic Task',
                status: 'READY',
                supports: { forward: true, comments: true },
            },
            decisions: [],
            customAttributes: [],
            taskObjects: [],
            comments: [],
            attachments: [],
            processingLogs: [],
            workflowLogs: [],
            businessContext: {
                type: 'PR',
                documentId: '10001',
                pr: {
                    header: {
                        prNumber: '10001',
                        requester: 'Nguyen Van A',
                        totalAmount: '5000000',
                    },
                    items: [
                        { material: 'MAT01', shortText: 'Laptop', quantity: '2', baseUnit: 'PC' }
                    ],
                },
            },
            fieldSchema: {
                prNumber: {
                    key: 'prNumber',
                    label: 'PR Number',
                    dataPath: '$.header.prNumber',
                    dataType: 'TEXT',
                },
                requester: {
                    key: 'requester',
                    label: 'Requester Name',
                    dataPath: '$.header.requester',
                    dataType: 'TEXT',
                },
                material: {
                    key: 'material',
                    label: 'Material Code',
                    dataPath: '$.material',
                    dataType: 'TEXT',
                },
                quantity: {
                    key: 'quantity',
                    label: 'Quantity Requested',
                    dataPath: '$.quantity',
                    dataType: 'QUANTITY',
                }
            },
            uiSchema: {
                title: 'PR {{prNumber}}',
                subtitle: 'Created by {{requester}}',
                sections: [
                    {
                        id: 'basic',
                        type: 'CARD',
                        title: 'Basic Info',
                        fields: ['prNumber', 'requester'],
                    },
                    {
                        id: 'items',
                        type: 'TABLE',
                        title: 'Items List',
                        dataPath: '$.items',
                        columns: ['material', 'quantity'],
                    }
                ],
            },
        };

        const result = resolveBusinessSectionModel(detail);
        expect(result.title).toBe('PR 10001');
        expect(result.subtitle).toBe('Created by Nguyen Van A');
        expect(result.cards).toHaveLength(1);
        expect(result.cards[0].title).toBe('Basic Info');
        expect(result.cards[0].fields).toHaveLength(2);
        expect(result.cards[0].fields[0].label).toBe('PR Number');
        expect(result.cards[0].fields[0].value).toBe('10001');

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].title).toBe('Items List');
        expect(result.tables[0].columns).toHaveLength(2);
        expect(result.tables[0].columns[0].label).toBe('Material Code');
        expect(result.tables[0].rows).toHaveLength(1);
        expect(result.tables[0].rows[0].values.material).toBe('MAT01');
        expect(result.tables[0].rows[0].values.quantity).toBe('2 PC');
    });
});

describe('resolveBusinessSectionModel with PO config', () => {
    it('successfully resolves PO model', () => {
        const detail: any = {
            task: {
                instanceId: '198793',
                title: 'Please release purchase order 4500002229',
                status: 'READY',
                priority: 'MEDIUM',
                createdOn: '2026-07-14T07:30:13.000Z',
                createdByName: 'SAP_WFRT',
                requestorName: 'SAP_WFRT',
                taskDefinitionId: 'TS20000166',
                supports: { forward: true, comments: true }
            },
            object: {
                objectType: 'PO',
                objectId: '4500002229',
                header: {
                    purchaseOrder: '4500002229',
                    purchaseOrderText: 'Testing for PO\ntest 1\n\n\ntest 2\n',
                    purchaseOrderTypeDisplay: 'ZFO8 (Expense PO)',
                    supplierName: '17300050',
                    createdByUser: 'DUYEN.TRAN',
                    paymentTermsText: 'Within 30 days due net',
                    incotermsClassification: 'FOB',
                    purchaseOrderNetAmount: 1496,
                    documentCurrency: 'CAD',
                    companyCodeDisplay: '1710',
                    purchasingOrganizationDisplay: '1710',
                    purchasingDocumentStatusName: 'IN PROCESSING',
                    priority: 'MEDIUM'
                },
                items: [
                    {
                        item: '10',
                        shortText: 'Laptop',
                        materialGroupDisplay: '-',
                        deliveryDate: '2026-07-14T07:30:13.000Z',
                        quantity: 5,
                        netPrice: 299.2,
                        netAmount: 1496
                    }
                ],
                workflow: {
                    steps: [],
                    comments: []
                },
                attachments: []
            },
            fieldSchema: {},
            uiSchema: {
                title: "{{header.purchaseOrder}}",
                subtitle: "{{header.supplierName}}",
                sections: [
                    {
                        id: "basic",
                        type: "CARD",
                        title: "Basic Data",
                        fields: ["purchaseOrder", "purchaseOrderText", "purchaseOrderTypeDisplay", "supplierName", "createdByUser"]
                    },
                    {
                        id: "items",
                        type: "TABLE",
                        title: "Items",
                        dataPath: "items",
                        columns: ["item", "shortText", "materialGroupDisplay", "deliveryDate", "quantity", "netPrice", "netAmount"]
                    }
                ]
            },
            decisions: [],
            customAttributes: [],
            taskObjects: [],
            comments: [],
            attachments: [],
            processingLogs: [],
            workflowLogs: []
        };

        const dynamicFieldSchema: Record<string, any> = {};
        const mockRootMappings = [
            { sourcePath: "purchaseOrder", targetPath: "header.purchaseOrder", type: "string" },
            { sourcePath: "purchaseOrderText", targetPath: "header.purchaseOrderText", type: "string" },
            { sourcePath: "purchaseOrderTypeDisplay", targetPath: "header.purchaseOrderTypeDisplay", type: "string" },
            { sourcePath: "supplierName", targetPath: "header.supplierName", type: "string" },
            { sourcePath: "createdByUser", targetPath: "header.createdByUser", type: "string" }
        ];
        const mockColFields = [
            { sourcePath: "purchaseOrderItem", targetPath: "item" },
            { sourcePath: "purchaseOrderItemText", targetPath: "shortText" },
            { sourcePath: "materialGroupDisplay", targetPath: "materialGroupDisplay" },
            { sourcePath: "firstDeliveryDate", targetPath: "deliveryDate" },
            { sourcePath: "orderQuantity", targetPath: "quantity", transform: "number" },
            { sourcePath: "netPriceAmount", targetPath: "netPrice", transform: "number" },
            { sourcePath: "netAmount", targetPath: "netAmount", transform: "number" }
        ];

        for (const m of mockRootMappings) {
            const parts = m.targetPath.split('.');
            const key = parts[parts.length - 1];
            dynamicFieldSchema[key] = {
                key,
                label: key,
                dataPath: `$.${m.targetPath}`,
                dataType: m.type === 'string' ? 'TEXT' : 'TEXT'
            };
        }
        for (const f of mockColFields) {
            const parts = f.targetPath.split('.');
            const key = parts[parts.length - 1];
            dynamicFieldSchema[key] = {
                key,
                label: key,
                dataPath: `$.${f.targetPath}`,
                dataType: f.transform === 'number' ? 'QUANTITY' : 'TEXT'
            };
        }
        detail.fieldSchema = dynamicFieldSchema;

        const result = resolveBusinessSectionModel(detail);
        expect(result.title).toBe('4500002229');
        expect(result.subtitle).toBe('17300050');
        expect(result.cards[0].fields[0].value).toBe('4500002229');
        expect(result.tables[0].rows[0].values.item).toBe('10');
        expect(result.tables[0].rows[0].values.quantity).toBe('5');
    });
});
