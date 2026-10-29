import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CategoryAccordionGroup } from '@/pages/Inbox/components/CategoryAccordionGroup';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, fallback: unknown) => typeof fallback === 'string' ? fallback : key }),
}));

function renderCategory(state: { isLoading: boolean; error: unknown }) {
    return renderToStaticMarkup(createElement(CategoryAccordionGroup, {
        tasks: [], selectedTaskId: null, normSelectedId: '', onSelectTask: vi.fn(), handleCardClick: vi.fn(),
        isMobile: false, showTaskActions: true, selectionMode: false, selectedIds: new Set(), onToggleSelection: vi.fn(),
        expandedCategories: new Set(['PO']), onToggleCategory: vi.fn(), categoryStates: { PO: state }, onRetryCategory: vi.fn(),
    }));
}

describe('category loading and recovery', () => {
    it('shows loading in a pending group rather than claiming it is empty', () => {
        const html = renderCategory({ isLoading: true, error: null });
        expect(html).toContain('role="status"');
        expect(html).toContain('Loading...');
        expect(html).not.toContain('No tasks in this category');
    });

    it('shows an inline retry for a failed group rather than claiming it is empty', () => {
        const html = renderCategory({ isLoading: false, error: new Error('SAP unavailable') });
        expect(html).toContain('role="alert"');
        expect(html).toContain('Unable to load this category.');
        expect(html).toContain('Retry');
        expect(html).not.toContain('No tasks in this category');
    });
});
