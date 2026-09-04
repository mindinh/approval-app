import { describe, it, expect } from 'vitest';
import { isTaskDetailPath, resolveNavTab } from '@/contexts/MobileNavContext';

describe('MobileNavContext pure helpers', () => {
    describe('resolveNavTab', () => {
        it('resolves home tab for root and /home', () => {
            expect(resolveNavTab('/')).toBe('home');
            expect(resolveNavTab('/home')).toBe('home');
        });

        it('resolves my tab for /inbox and /tasks', () => {
            expect(resolveNavTab('/inbox')).toBe('my');
            expect(resolveNavTab('/tasks')).toBe('my');
            expect(resolveNavTab('/inbox/12345')).toBe('my');
            expect(resolveNavTab('/tasks/99999')).toBe('my');
        });

        it('resolves approved tab for /approved routes', () => {
            expect(resolveNavTab('/approved')).toBe('approved');
            expect(resolveNavTab('/approved/12345')).toBe('approved');
        });

        it('resolves dashboard tab for /dashboard', () => {
            expect(resolveNavTab('/dashboard')).toBe('dashboard');
        });

        it('resolves other for unknown routes', () => {
            expect(resolveNavTab('/settings')).toBe('other');
        });
    });

    describe('isTaskDetailPath', () => {
        it('returns false for list/landing routes', () => {
            expect(isTaskDetailPath('/')).toBe(false);
            expect(isTaskDetailPath('/home')).toBe(false);
            expect(isTaskDetailPath('/inbox')).toBe(false);
            expect(isTaskDetailPath('/approved')).toBe(false);
            expect(isTaskDetailPath('/dashboard')).toBe(false);
        });

        it('returns true for task detail drill-down routes', () => {
            expect(isTaskDetailPath('/inbox/12345')).toBe(true);
            expect(isTaskDetailPath('/approved/54321')).toBe(true);
            expect(isTaskDetailPath('/tasks/99999')).toBe(true);
        });

        it('returns true for nested subpaths under task detail', () => {
            expect(isTaskDetailPath('/inbox/12345/comments')).toBe(true);
            expect(isTaskDetailPath('/approved/54321/attachments')).toBe(true);
            expect(isTaskDetailPath('/tasks/99999/items')).toBe(true);
        });

        it('returns false for non-task paths starting with inbox or approved', () => {
            expect(isTaskDetailPath('/inbox')).toBe(false);
            expect(isTaskDetailPath('/approved')).toBe(false);
        });
    });
});
