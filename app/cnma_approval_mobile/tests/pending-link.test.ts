import { rememberPendingLink, takePendingLink, taskPathOf } from '@/lib/navigation/pending-link';

describe('taskPathOf', () => {
    it('reads task links in every form', () => {
        expect(taskPathOf('cnmaapproval://tasks/ABC123')).toBe('/tasks/ABC123');
        expect(taskPathOf('/tasks/ABC123?from=mail')).toBe('/tasks/ABC123');
        expect(taskPathOf('tasks/ABC123')).toBe('/tasks/ABC123');
        expect(taskPathOf('https://approval.example.com/tasks/ABC123')).toBe('/tasks/ABC123');
    });

    it('ignores other links', () => {
        expect(taskPathOf('cnmaapproval://auth?code=x')).toBeNull();
        expect(taskPathOf('/inbox')).toBeNull();
        expect(taskPathOf('/tasks/')).toBeNull();
    });
});

describe('pending link', () => {
    it('is taken once, and only while recent', () => {
        rememberPendingLink('cnmaapproval://tasks/1');
        expect(takePendingLink()).toBe('/tasks/1');
        expect(takePendingLink()).toBeNull();

        rememberPendingLink('/tasks/2');
        expect(takePendingLink(Date.now() + 11 * 60_000)).toBeNull();
    });

    it('ignores non-task links', () => {
        rememberPendingLink('/inbox');
        expect(takePendingLink()).toBeNull();
    });
});
