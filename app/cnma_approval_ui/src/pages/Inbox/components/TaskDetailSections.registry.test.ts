import { describe, it, expect } from 'vitest';
import { resolveBusinessSectionModel } from './TaskDetailSections.registry';
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
        expect(result.title).toBe('Purchase Requisition');
        expect(result.subtitle).toBe('PR 10001');
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
