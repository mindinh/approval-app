import { describe, it, expect } from 'vitest';
import { makeTabDefinitions } from '@/pages/Inbox/components/panels';
import type { TaskDetail } from '@/services/inbox/inbox.types';

// Mock translation function
const t = (key: string, fallback: string) => fallback;

const makeMockDetail = (type: string): TaskDetail => ({
    task: {
        instanceId: 'task-123',
        title: 'Mock Title',
        status: 'READY',
        priority: 'MEDIUM',
        createdOn: '2024-04-09T10:00:00Z',
        createdByName: 'Requestor A',
        sapOrigin: 'LOCAL',
        supports: { forward: true, comments: true },
        businessContext: {
            type,
            documentId: 'DOC-001',
        },
    },
    decisions: [],
    customAttributes: [],
    taskObjects: [],
    comments: [
        { id: 'c-1', text: 'Comment 1', createdBy: 'A', createdByName: 'A', createdAt: '2024-04-09T10:00:00Z' }
    ],
    attachments: [
        { id: 'a-1', fileName: 'file1.pdf', fileDisplayName: 'file1.pdf', mimeType: 'application/pdf', size: 100 }
    ],
    processingLogs: [],
    workflowLogs: [],
    businessContext: {
        type,
        documentId: 'DOC-001',
    },
});

describe('makeTabDefinitions', () => {
    it('returns tabs with workflow for PR tasks', () => {
        const detail = makeMockDetail('PR');
        const tabs = makeTabDefinitions({
            detail,
            workflowCount: 3,
            workflowComments: [],
            detailsCount: 5,
            attachmentCount: 1,
            t,
        });

        const tabValues = tabs.map(tab => tab.value);
        expect(tabValues).toContain('workflow');
        
        const workflowTab = tabs.find(tab => tab.value === 'workflow');
        expect(workflowTab?.count).toBe(3);

        const detailsTab = tabs.find(tab => tab.value === 'details');
        expect(detailsTab?.count).toBe(5);

        const attachmentsTab = tabs.find(tab => tab.value === 'attachments');
        expect(attachmentsTab?.count).toBe(1);

        const commentsTab = tabs.find(tab => tab.value === 'comments');
        expect(commentsTab?.count).toBe(1);
    });

    it('hides workflow tab for unsupported document tasks', () => {
        const detail = makeMockDetail('UNKNOWN');
        const tabs = makeTabDefinitions({
            detail,
            workflowCount: 0,
            workflowComments: [],
            detailsCount: 2,
            attachmentCount: 0,
            t,
        });

        const tabValues = tabs.map(tab => tab.value);
        expect(tabValues).not.toContain('workflow');

        const detailsTab = tabs.find(tab => tab.value === 'details');
        expect(detailsTab?.count).toBe(2);
    });

    it('returns tabs with workflow for CLAIM tasks', () => {
        const detail = makeMockDetail('CLAIM');
        const tabs = makeTabDefinitions({
            detail,
            workflowCount: 2,
            workflowComments: [],
            detailsCount: 1,
            attachmentCount: 0,
            t,
        });

        const tabValues = tabs.map(tab => tab.value);
        expect(tabValues).toContain('workflow');

        const workflowTab = tabs.find(tab => tab.value === 'workflow');
        expect(workflowTab?.count).toBe(2);
    });

    it('returns tabs with workflow for PO tasks', () => {
        const detail = makeMockDetail('PO');
        const tabs = makeTabDefinitions({
            detail,
            workflowCount: 2,
            workflowComments: [],
            detailsCount: 4,
            attachmentCount: 1,
            t,
        });

        const tabValues = tabs.map(tab => tab.value);
        expect(tabValues).toContain('workflow');

        const workflowTab = tabs.find(tab => tab.value === 'workflow');
        expect(workflowTab?.count).toBe(2);
    });

    it('does not display details count when detailsCount is 0 or undefined', () => {
        const detail = makeMockDetail('PO');
        const tabs = makeTabDefinitions({
            detail,
            workflowCount: 0,
            workflowComments: [],
            detailsCount: undefined,
            attachmentCount: 0,
            t,
        });

        const detailsTab = tabs.find(tab => tab.value === 'details');
        expect(detailsTab?.count).toBeUndefined();
    });

    it('deduplicates and merges task and workflow comments in tab count', () => {
        const detail = makeMockDetail('PR');
        const workflowComments = [
            { docNum: 'DOC-001', noteText: 'Comment 1', userComment: 'A', postedOn: '2024-04-09', postedTime: '10:00:00' } // Duplicate
        ];

        const tabs = makeTabDefinitions({
            detail,
            workflowCount: 0,
            workflowComments,
            detailsCount: undefined,
            attachmentCount: 0,
            t,
        });

        const commentsTab = tabs.find(tab => tab.value === 'comments');
        expect(commentsTab?.count).toBe(1); // 1 deduplicated comment
    });
});
