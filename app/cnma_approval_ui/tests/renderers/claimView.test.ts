import { describe, it, expect } from 'vitest';
import { formatNoteText } from '@/renderers/core/formatters';
import { CLAIM_OVERVIEW_FIELDS } from '@/renderers/objects/claim/claim.fields';
import { CLAIM_VIEW } from '@/renderers/objects/claim/claim.view';
import { evalField, resolveObjectView } from '@/renderers/core/objectView';

describe('formatNoteText', () => {
    it('handles standard newlines and trims whitespace per line', () => {
        const input = '[USER1 10:00:00] note 1 \n[USER2 10:05:00] note 2 ';
        const output = formatNoteText(input);
        expect(output).toBe('[USER1 10:00:00] note 1\n[USER2 10:05:00] note 2');
    });

    it('splits only on actual newlines and preserves /n and literal \\n', () => {
        const input =
            '[CONARUM1 30.09.2026 10:02:45] 30.09.2026 notes 1\n[CONARUM1 30.09.2026 10:03:05] notes 2/n/n/n/n notes 3\n[CONARUM1 30.09.2026 10:05:35] notes 3 \\n\\n notes 5';
        const output = formatNoteText(input);
        const lines = output.split('\n');
        expect(lines).toHaveLength(3);
        expect(lines[0]).toBe('[CONARUM1 30.09.2026 10:02:45] 30.09.2026 notes 1');
        expect(lines[1]).toBe('[CONARUM1 30.09.2026 10:03:05] notes 2/n/n/n/n notes 3');
        expect(lines[2]).toBe('[CONARUM1 30.09.2026 10:05:35] notes 3 \\n\\n notes 5');
    });

    it('formats user sample note correctly with 4 entries', () => {
        const input = '[CONARUM1 29.09.2026 11:27:02] need to verify\n[CONARUM1 29.09.2026 11:27:17] need to recheck \n[CONARUM2 29.09.2026 11:45:17] conarum 2 note for reviewing\n[CONARUM2 29.09.2026 11:46:21] This is a test note for the Claim Form. Please review....';
        const output = formatNoteText(input);
        const lines = output.split('\n');
        expect(lines).toHaveLength(4);
        expect(lines[0]).toBe('[CONARUM1 29.09.2026 11:27:02] need to verify');
        expect(lines[1]).toBe('[CONARUM1 29.09.2026 11:27:17] need to recheck');
        expect(lines[2]).toBe('[CONARUM2 29.09.2026 11:45:17] conarum 2 note for reviewing');
        expect(lines[3]).toBe('[CONARUM2 29.09.2026 11:46:21] This is a test note for the Claim Form. Please review....');
    });

    it('returns dash for empty, null, or undefined', () => {
        expect(formatNoteText('')).toBe('-');
        expect(formatNoteText('   ')).toBe('-');
        expect(formatNoteText(null)).toBe('-');
        expect(formatNoteText(undefined)).toBe('-');
    });
});

describe('CLAIM_OVERVIEW_FIELDS & CLAIM_VIEW', () => {
    it('pairs item amounts with document and header local currency using the CLAIM locale', () => {
        const amounts = {
            PaymentAmount: 243563.97,
            TotalNetAmountLocalCrcy: 6347277058,
            DocumentCurrency: 'USD',
        };
        const model = resolveObjectView(CLAIM_VIEW, {
            ...amounts,
            LocalCurrency: 'VND',
            _Item: [{ ...amounts, ItemNumber: '1', InvoiceAmount: 243563.97 }],
        });

        const header = model.cards[0].fields;
        const item = model.tables[0].rows[0].values;
        expect(item.paymentAmount).toBe('243.563,97 USD');
        expect(item.totalNetAmountLocalCrcy).toBe('6.347.277.058 VND');
        expect(item.invoiceAmount).toBe('243.563,97 USD');
        expect(item.paymentAmount).toBe(header.find(field => field.label === 'Payment Amount')?.value);
        expect(item.totalNetAmountLocalCrcy).toBe(header.find(field => field.label === 'Total Amount')?.value);
    });

    const mockRecord = {
        DocCategory: 'CLAIM',
        DocumentNumber: '0000000284',
        ClaimType: 'CLM1',
        ClaimTypeText: 'Expense Claim',
        UserName: 'TEST_USER',
        CreationDate: '2026-09-29',
        CreationTime: '08:00:00',
        CompanyCode: '1000',
        CompanyCodeName: 'Acme Corp',
        ClaimStatus: 'In Process',
        Note: '[CONARUM1 29.09.2026 11:27:02] need to verify\n[CONARUM1 29.09.2026 11:27:17] need to recheck \n[CONARUM2 29.09.2026 11:45:17] conarum 2 note for reviewing\n[CONARUM2 29.09.2026 11:46:21] This is a test note for the Claim Form. Please review....',
        VeriStatus: '1',
        VeriStatusDesc: 'Verified',
        VeriBy: 'CONARUM1',
        VeriDate: '2026-09-29',
        VeriTime: '11:33:39',
        VeriComment: 'conarum 1 ok for verification',
        Vendor: 'V100',
        VendorName1: 'Vendor One',
        PaymentAmount: '500.00',
        TotalNetAmountLocalCrcy: '500.00',
        LocalCurrency: 'USD'
    };

    it('resolves verification status code and description', () => {
        const field = evalField(CLAIM_OVERVIEW_FIELDS.veriStatus, mockRecord);
        expect(field).not.toBeNull();
        expect(field?.value).toBe('1 - Verified');
        expect(field?.label).toBe('Verify Status');
    });

    it('resolves verified by and comment', () => {
        const byField = evalField(CLAIM_OVERVIEW_FIELDS.veriBy, mockRecord);
        expect(byField?.value).toBe('CONARUM1');
        expect(byField?.label).toBe('Verified/Refused By');

        const commentField = evalField(CLAIM_OVERVIEW_FIELDS.veriComment, mockRecord);
        expect(commentField?.value).toBe('conarum 1 ok for verification');
        expect(commentField?.label).toBe('Verify Comment');
    });

    it('resolves verified date and time formatted together', () => {
        const dateField = evalField(CLAIM_OVERVIEW_FIELDS.veriDate, mockRecord);
        expect(dateField?.value).toBe('29/09/2026 11:33:39');
        expect(dateField?.label).toBe('Verify Time');
    });

    it('resolves note field as isLongText with reformatted newlines in overview card', () => {
        const noteField = evalField(CLAIM_OVERVIEW_FIELDS.note, mockRecord);
        expect(noteField?.isLongText).toBe(true);
        expect(noteField?.label).toBe('Note');
        expect(noteField?.value).toContain('\n');
        expect(noteField?.value.split('\n')).toHaveLength(4);
    });

    it('places core fields and note in overviewCard, and verification fields in Verification card', () => {
        const overviewKeys = (CLAIM_VIEW.overviewCard?.fields || []).map((f: any) => f.key);
        expect(overviewKeys).toContain('DocumentNumber|ClaimNumber');
        expect(overviewKeys).toContain('Note|Notes');
        expect(overviewKeys).not.toContain('VeriBy');

        const verificationCard = CLAIM_VIEW.overviewCards?.find((c) => c.id === 'claim-verification');
        expect(verificationCard).toBeDefined();
        expect(verificationCard?.title).toBe('Verification');

        const veriKeys = (verificationCard?.fields || []).map((f: any) => f.key);
        expect(veriKeys).toContain('VeriStatus_VeriStatusDesc');
        expect(veriKeys).toContain('VeriBy');
        expect(veriKeys).toContain('VeriDate');
        expect(veriKeys).toContain('VeriComment');
    });

    it('resolves multiple cards via resolveObjectView', async () => {
        const { resolveObjectView } = await import('@/renderers/core/objectView');
        const model = resolveObjectView(CLAIM_VIEW, mockRecord);

        expect(model.cards).toHaveLength(2);
        expect(model.cards[0].id).toBe('claim-summary');
        expect(model.cards[0].title).toBe('Document Summary');

        expect(model.cards[1].id).toBe('claim-verification');
        expect(model.cards[1].title).toBe('Verification');
        expect(model.cards[1].fields).toHaveLength(4);

        const veriStatusField = model.cards[1].fields.find((f) => f.label === 'Verify Status');
        expect(veriStatusField?.value).toBe('1 - Verified');

        const veriByField = model.cards[1].fields.find((f) => f.label === 'Verified/Refused By');
        expect(veriByField?.value).toBe('CONARUM1');

        const veriDateField = model.cards[1].fields.find((f) => f.label === 'Verify Time');
        expect(veriDateField?.value).toBe('29/09/2026 11:33:39');

        const veriCommentField = model.cards[1].fields.find((f) => f.label === 'Verify Comment');
        expect(veriCommentField?.value).toBe('conarum 1 ok for verification');
    });
});
