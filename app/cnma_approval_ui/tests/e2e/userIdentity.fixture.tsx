import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../../src/i18n';
import '../../src/styles/index.css';
import { MainLayout } from '../../src/components/layouts/MainLayout';
import { CommentsPanel } from '../../src/pages/Inbox/components/panels/CommentsPanel';
import { ErrorProvider } from '../../src/contexts/ErrorProvider';
import type { TaskDetail } from '../../src/services/inbox/inbox.types';

const detail = { comments: [
    { id: 'own', text: 'Own comment', createdBy: 'CONARUM1', createdAt: '2020-01-15T08:00:00' },
    { id: 'other', text: 'Other comment', createdBy: 'CONARUM2', createdAt: new Date().toISOString() },
    { id: 'same-day', text: 'Same day comment', createdBy: 'CONARUM2', createdAt: new Date().toISOString() },
] } as TaskDetail;
export function Page() {
    return useLocation().pathname === '/inbox' ? <CommentsPanel detail={detail} /> : null;
}
createRoot(document.getElementById('root')!).render(
    <BrowserRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ErrorProvider><Routes><Route element={<MainLayout />}><Route path="*" element={<Page />} /></Route></Routes></ErrorProvider>
    </QueryClientProvider></BrowserRouter>,
);
