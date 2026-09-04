import { describe, it, expect } from 'vitest';
import { PrDetail } from '../../../srv/lib/integrations/pr';
import { PoDetail } from '../../../srv/lib/integrations/po';
import { ReDetail } from '../../../srv/lib/integrations/re';
import { ClaimDetail } from '../../../srv/lib/integrations/claim';

// We don't exercise the SAP call here — we directly access the protected
// buildCommentPayload via a cast to assert payload construction is consistent
// across all four strategies.
function payloadBuilder(strategy: any) {
    return strategy.buildCommentPayload.bind(strategy) as (text: string, options?: any) => any;
}

function forwardBuilder(strategy: any) {
    return strategy.buildForwardPayload.bind(strategy) as (params: any) => any;
}

describe('BaseRawDetail.buildCommentPayload (shared across all strategies)', () => {
    const strategies: Array<{ name: string; strategy: any }> = [
        { name: 'PR', strategy: new PrDetail({} as any, {} as any) },
        { name: 'PO', strategy: new PoDetail({} as any, {} as any) },
        { name: 'RE', strategy: new ReDetail({} as any, {} as any) },
        { name: 'CLAIM', strategy: new ClaimDetail({} as any, {} as any) },
    ];

    for (const { name, strategy } of strategies) {
        describe(name, () => {
            it('returns the canonical payload shape for a plain comment', () => {
                const payload = payloadBuilder(strategy)('hello world', {
                    taskId: '  task-1234  ',
                    taggedUsers: [{ USERNAME: ' CONARUM3 ', EMAIL: ' x@y.com ' }],
                });

                expect(payload).toEqual({
                    TASKID: 'task-1234',
                    NOTETEXT: 'hello world',
                    ISGENERAL: true,
                    DECISION: '',
                    TAGGEDUSER: [{ USERNAME: 'CONARUM3', EMAIL: 'x@y.com' }],
                    FORWARD: false,
                });
            });

            it('flips ISGENERAL to false and records DECISION for decision comments', () => {
                const payload = payloadBuilder(strategy)('approve reason', {
                    taskId: 't',
                    decision: 'A',
                });
                expect(payload.ISGENERAL).toBe(false);
                expect(payload.DECISION).toBe('A');
            });

            it('truncates NOTETEXT to 255 chars', () => {
                const longText = 'a'.repeat(500);
                const payload = payloadBuilder(strategy)(longText, {});
                expect(payload.NOTETEXT.length).toBe(255);
            });

            it('truncates TASKID to 12 chars', () => {
                const payload = payloadBuilder(strategy)('hi', { taskId: '1234567890123456' });
                expect(payload.TASKID.length).toBe(12);
            });

            it('handles empty taggedUsers gracefully', () => {
                const payload = payloadBuilder(strategy)('hi', {});
                expect(payload.TAGGEDUSER).toEqual([]);
            });
        });
    }
});

describe('BaseRawDetail.buildForwardPayload (shared across PR / PO)', () => {
    const strategies = [
        { name: 'PR', strategy: new PrDetail({} as any, {} as any) },
        { name: 'PO', strategy: new PoDetail({} as any, {} as any) },
    ];

    for (const { name, strategy } of strategies) {
        it(`${name} builds the canonical { task_id, notetext, to_user } payload`, () => {
            const payload = forwardBuilder(strategy)({
                taskId: '  1234567890123456  ',
                notetext: '  Forward note  ',
                toUser: '  CONARUM3  ',
            });
            expect(payload).toEqual({
                task_id: '123456789012',
                notetext: 'Forward note',
                to_user: 'CONARUM3',
            });
        });
    }
});

describe('BaseRawDetail.padDocumentId', () => {
    const strategy: any = new ClaimDetail({} as any, {} as any);

    it('pads numeric ids to 10 chars', () => {
        expect(strategy.padDocumentId('212')).toBe('0000000212');
        expect(strategy.padDocumentId('0000000212')).toBe('0000000212');
    });

    it('passes through non-numeric ids unchanged', () => {
        expect(strategy.padDocumentId('EXT-001')).toBe('EXT-001');
    });

    it('slices ids longer than 10 chars to 10', () => {
        expect(strategy.padDocumentId('123456789012345')).toBe('1234567890');
    });
});

describe('BaseRawDetail.buildHeaderUrl', () => {
    const prStrategy: any = new PrDetail({} as any, {} as any);
    const claimStrategy: any = new ClaimDetail({} as any, {} as any);

    it('builds standard header URL for PR', () => {
        expect(prStrategy.buildHeaderUrl('212')).toBe("/CNMA_PRHEADER(DocCategory='BUS2105',DocumentNumber='0000000212')");
    });

    it('builds CLAIM header URL with default ApproverNumber=1', () => {
        expect(claimStrategy.buildHeaderUrl('216')).toBe("/CNMA_CLAIMHEADER(DocCategory='CLAIM',DocumentNumber='0000000216',ApproverNumber='1')");
    });

    it('builds CLAIM header URL with custom ApproverNumber', () => {
        expect(claimStrategy.buildHeaderUrl('216', { approverNumber: '3' })).toBe("/CNMA_CLAIMHEADER(DocCategory='CLAIM',DocumentNumber='0000000216',ApproverNumber='3')");
    });
});
