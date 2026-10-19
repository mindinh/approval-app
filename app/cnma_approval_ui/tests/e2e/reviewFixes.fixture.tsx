import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button, Card } from '@cnma/react-ui';
import '../../src/i18n';
import '../../src/styles/index.css';
import { ErrorProvider } from '../../src/contexts/ErrorProvider';
import { TagUserDialog } from '../../src/pages/Inbox/components/TagUserDialog';
import { TaskDetailView } from '../../src/pages/Inbox/components/TaskDetailView';
import { ReferencePrDetailView } from '../../src/pages/Inbox/components/ReferencePrDetailView';

const detail = {
    instanceId: 'review-1', normalTask: false, objectType: 'PO',
    businessObject: {
        DocCategory: 'BUS2012', DocumentNumber: '4500000001', DocumentType: 'NB', _Comment: [],
        _Item: Array.from({ length: 20 }, (_, index) => ({ ItemNumber: String(index + 1), Material: `MATERIAL-${index + 1}`, MaterialName: `Item ${index + 1}` })),
    },
    taskprocessing: { task: { InstanceID: 'review-1', Status: 'READY' }, decisionOptions: [] },
};

export function ReviewFixes() {
    const [open, setOpen] = useState(true);
    if (location.pathname === '/reference-pr') return <Card className="h-screen overflow-hidden">
        <ReferencePrDetailView prNumber="1000000001" onBack={() => {}} />
    </Card>;
    if (location.pathname === '/tag-users') return (
        <Card>
            <Button onClick={() => setOpen(true)}>Open tag dialog</Button>
            <TagUserDialog isOpen={open} onClose={() => setOpen(false)} onApplyTags={() => {}} />
        </Card>
    );
    return <Card className={location.pathname === '/task-desktop' ? 'h-screen overflow-hidden' : 'h-96 overflow-hidden'}>
        <TaskDetailView detail={detail} isLoading={false} isMobile={location.pathname !== '/task-desktop'} isExecuting={false}
            onBack={() => {}} onDecision={() => {}} />
    </Card>;
}

createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={new QueryClient()}><ErrorProvider><ReviewFixes /></ErrorProvider></QueryClientProvider>,
);
