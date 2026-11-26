import { MASS_LIMIT, massSelection } from '@/hooks/mutations/mass-selection';
import { massDecisionTimeout, toMassItem } from '@/hooks/mutations/use-decide-tasks';
import type { TaskSummary } from '@/utils/task-summary';

const task = (id: string, extra: Partial<TaskSummary> = {}) =>
    ({ instanceId: id, documentId: `DOC${id}`, isCc: false, completed: false, decisionContext: { businessObjectType: 'BUS2105', sapOrigin: 'LOCAL' }, ...extra }) as TaskSummary;

describe('massSelection', () => {
    beforeEach(() => massSelection.start());

    it('toggles tasks and never selects CC (review-only) tasks', () => {
        expect(massSelection.toggle(task('1'))).toBe(true);
        expect(massSelection.toggle(task('2', { isCc: true }))).toBe(false);
        expect([...massSelection.get().tasks.keys()]).toEqual(['1']);
        massSelection.toggle(task('1'));
        expect(massSelection.get().tasks.size).toBe(0);
    });

    it('select all takes the selectable ones up to the limit, a second tap clears', () => {
        const many = Array.from({ length: MASS_LIMIT + 5 }, (_, index) => task(String(index)));
        massSelection.toggleAll([task('cc', { isCc: true }), ...many]);
        expect(massSelection.get().tasks.size).toBe(MASS_LIMIT);
        expect(massSelection.get().tasks.has('cc')).toBe(false);
        expect(massSelection.toggle(task('extra'))).toBe(false);
        massSelection.toggleAll(many.slice(0, MASS_LIMIT));
        expect(massSelection.get().tasks.size).toBe(0);
    });

    it('end leaves selection mode', () => {
        massSelection.toggle(task('1'));
        massSelection.end();
        expect(massSelection.get()).toEqual({ active: false, tasks: new Map() });
    });
});

describe('mass decision payload', () => {
    it('sends the same context fields as the web', () => {
        expect(toMassItem(task('7'))).toEqual({ instanceId: '7', documentId: 'DOC7', documentNumber: 'DOC7', businessObjectType: 'BUS2105', sapOrigin: 'LOCAL' });
    });

    it('scales the timeout with the batch (four per round) and caps it', () => {
        expect(massDecisionTimeout(1)).toBe(45_000);
        expect(massDecisionTimeout(8)).toBe(60_000);
        expect(massDecisionTimeout(500)).toBe(180_000);
    });
});
