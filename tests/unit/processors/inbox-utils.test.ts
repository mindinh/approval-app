import { describe, it, expect } from 'vitest';
import {
    normalizePriority,
    normalizeDate,
    cleanBusinessObjectForList,
    formatTaskTitle,
    filterComments,
    decorateActions,
    decorateAttachments
} from '../../../srv/lib/processors/inbox-utils';

describe('inbox-utils', () => {
    describe('normalizePriority', () => {
        it('should map numeric and word priorities to canonical uppercase priorities', () => {
            expect(normalizePriority('1')).toBe('VERY_HIGH');
            expect(normalizePriority('2')).toBe('HIGH');
            expect(normalizePriority('3')).toBe('MEDIUM');
            expect(normalizePriority('4')).toBe('LOW');
            expect(normalizePriority('VERY_HIGH')).toBe('VERY_HIGH');
            expect(normalizePriority('HIGH')).toBe('HIGH');
            expect(normalizePriority('NOT_VALID')).toBe('MEDIUM');
            expect(normalizePriority(undefined)).toBe('MEDIUM');
        });
    });

    describe('normalizeDate', () => {
        it('should convert SAP /Date(ms)/ format to ISO string', () => {
            const dateMs = '/Date(1700000000000)/';
            const iso = normalizeDate(dateMs);
            expect(iso).toBe(new Date(1700000000000).toISOString());
        });

        it('should return valid ISO dates unchanged', () => {
            const isoInput = '2026-07-24T12:00:00.000Z';
            expect(normalizeDate(isoInput)).toBe(isoInput);
        });

        it('should handle undefined or null input gracefully', () => {
            expect(normalizeDate(undefined)).toBeUndefined();
            expect(normalizeDate(null)).toBeUndefined();
        });
    });

    describe('cleanBusinessObjectForList', () => {
        it('should strip empty arrays, empty objects, and null values', () => {
            const input = {
                id: '123',
                name: 'Test',
                emptyArr: [],
                validArr: [1, 2],
                emptyObj: {},
                nested: {
                    empty: null,
                    val: 'hello'
                }
            };
            const result = cleanBusinessObjectForList(input);
            expect(result).toEqual({
                id: '123',
                name: 'Test',
                validArr: [1, 2],
                nested: {
                    val: 'hello'
                }
            });
        });
    });

    describe('formatTaskTitle', () => {
        it('should use matchingTask TaskTitle if present', () => {
            const title = formatTaskTitle({}, { TaskTitle: 'Custom Title' }, 'PR');
            expect(title).toBe('Custom Title');
        });

        it('should derive Review/Approve prefix correctly based on normalTask and completion status', () => {
            expect(formatTaskTitle({ normalTask: true, instid: '100' }, null, 'PR')).toBe('Approve PR 100');
            expect(formatTaskTitle({ normalTask: false, instid: '100' }, null, 'PR')).toBe('Review PR 100');
            expect(formatTaskTitle({ normalTask: true, instid: '100' }, null, 'PR', 'COMPLETED')).toBe('Approved PR 100');
            expect(formatTaskTitle({ normalTask: false, instid: '100' }, null, 'PR', 'COMPLETED')).toBe('Reviewed PR 100');
        });
    });

    describe('filterComments', () => {
        it('should drop comments with empty or whitespace-only text', () => {
            const rawComments = [
                { author: 'System', text: '' },
                { author: 'User A', text: '  ' },
                { author: 'User B', text: 'Valid comment text' },
                { author: 'System', text: null }
            ];

            const filtered = filterComments(rawComments);
            expect(filtered.length).toBe(1);
            expect(filtered[0].createdBy).toBe('User B');
            expect(filtered[0].text).toBe('Valid comment text');
        });

        it('should handle non-array input by returning empty array', () => {
            expect(filterComments(null as any)).toEqual([]);
        });
    });


    describe('decorateActions', () => {
        it('should decorate SAP decisions with UI nature and confirmation attributes', () => {
            const sapDecisions = [
                { DecisionKey: '0001', DecisionText: 'Approve' },
                { DecisionKey: '0002', DecisionText: 'Reject' }
            ];
            const config = {
                actions: [
                    { sapDecisionKey: '0001', variant: 'PRIMARY', requiresComment: false },
                    { sapDecisionKey: '0002', variant: 'DANGER', requiresComment: true, confirmRequired: true, confirmMessage: 'Are you sure?' }
                ]
            };

            const actions = decorateActions(sapDecisions, config);
            expect(actions.length).toBe(2);
            expect(actions[0]).toMatchObject({
                key: '0001',
                label: 'Approve',
                nature: 'POSITIVE',
                variant: 'PRIMARY',
                requiresComment: false
            });
            expect(actions[1]).toMatchObject({
                key: '0002',
                label: 'Reject',
                nature: 'NEGATIVE',
                variant: 'DANGER',
                requiresComment: true,
                confirmRequired: true
            });
        });
    });

    describe('decorateAttachments', () => {
        it('should format attachment metadata with single /tasks/ path link', () => {
            const attachments = [
                { id: 'att-1', fileName: 'doc.pdf', mimeType: 'application/pdf', fileSize: 1024 }
            ];

            const result = decorateAttachments(attachments, 'task-100', '10000001');
            expect(result.length).toBe(1);
            expect(result[0].link).toBe('/api/cnma/APPROVAL_SRV/tasks/task-100/attachments/att-1/content/doc.pdf?documentId=10000001');
        });
    });

});
