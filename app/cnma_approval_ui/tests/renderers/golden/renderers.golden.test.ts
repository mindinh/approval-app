/**
 * Golden tests: lock the exact output of the document renderers so refactors cannot
 * change what users see. If a snapshot changes, the change must be intentional and reviewed.
 */
process.env.TZ = 'Asia/Ho_Chi_Minh';

import { describe, it, expect } from 'vitest';
import { resolveBusinessSectionModel, resolveTaskCardConfigForTask, type BusinessSectionModel } from '@/renderers';
import type { InboxTask } from '@/services/inbox/inbox.types';
import {
    CLAIM_RECORD,
    PO_HEADER,
    PO_ITEMS,
    PO_SUBTYPES,
    PR_HEADER,
    PR_ITEMS,
    PR_SUBTYPES,
    RESERVATION_RECORD,
    TASK_CASES,
    poRecord,
    prRecord,
} from './fixtures';

/** What users see: the model without additive metadata (field `kind`), so snapshots lock the display. */
function displayed(model: BusinessSectionModel) {
    return { ...model, cards: model.cards.map((card) => ({ ...card, fields: card.fields.map(({ kind: _kind, ...field }) => field) })) };
}

const render = (input: Parameters<typeof resolveBusinessSectionModel>[0]) => displayed(resolveBusinessSectionModel(input));

describe('golden: business section model', () => {
    it.each(PR_SUBTYPES)('PR %s', (docType) => {
        expect(render({ businessObject: prRecord(docType) })).toMatchSnapshot();
    });

    it.each(PO_SUBTYPES)('PO %s', (docType) => {
        expect(render({ businessObject: poRecord(docType) })).toMatchSnapshot();
    });

    it('Claim', () => {
        expect(render({ businessObject: CLAIM_RECORD })).toMatchSnapshot();
    });

    it('Reservation', () => {
        expect(render({ businessObject: RESERVATION_RECORD })).toMatchSnapshot();
    });

    it('sparse records render placeholders', () => {
        const sparse = ['BUS2105', 'BUS2012', 'CLAIM', 'ZBUS2093'].map((cat) =>
            render({ businessObject: { DocCategory: cat, _Item: [{}] } })
        );
        expect(sparse).toMatchSnapshot();
    });

    it('accepts header/items and raw detail shapes', () => {
        expect(render({ header: { ...PO_HEADER, DocumentType: 'ZNB1' }, items: PO_ITEMS })).toMatchSnapshot();
        expect(render({ ...PR_HEADER, DocumentType: 'ZTOL', _Item: PR_ITEMS })).toMatchSnapshot();
        expect(render(null)).toMatchSnapshot();
    });

    it('resolves category aliases to the same view', () => {
        const ids = (cat: string) => resolveBusinessSectionModel({ businessObject: { DocCategory: cat } }).cards.map((c) => c.id);
        expect(ids('PR')).toEqual(ids('BUS2105'));
        expect(ids('PO')).toEqual(ids('BUS2012'));
        for (const alias of ['BUS2093', 'RE', 'RESV']) expect(ids(alias)).toEqual(ids('ZBUS2093'));
        expect(ids('ZCLAIM')).toEqual(ids('CLAIM'));
        expect(resolveBusinessSectionModel({ businessObject: { objectType: 'po' } }).cards.map((c) => c.id)).toEqual(ids('PO'));
    });
});

describe('golden: task card', () => {
    it.each(TASK_CASES.map((c) => [c.name, c] as const))('%s', (_name, { task, cachedDetail }) => {
        const { viewDef, tone, chips } = resolveTaskCardConfigForTask(task as unknown as InboxTask, cachedDetail);
        expect({
            tone,
            overviewCardId: viewDef.overviewCard.id,
            tableId: viewDef.lineItemTable?.id ?? null,
            chips,
        }).toMatchSnapshot();
    });
});
