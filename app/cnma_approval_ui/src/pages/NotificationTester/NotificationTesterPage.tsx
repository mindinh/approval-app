import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useIsMobile, Button, useConfirm } from '@cnma/react-ui';
import { Shield } from 'lucide-react';
import { useCurrentUser } from '@/pages/Inbox/hooks/inboxQueries';
import { useNotificationTester, type ParsedNotificationType } from './useNotificationTester';
import { NotificationHeader } from './components/NotificationHeader';
import { NotificationCards } from './components/NotificationCards';
import { NotificationDispatchForm } from './components/NotificationDispatchForm';
import { NotificationTypesTable } from './components/NotificationTypesTable';
import { NotificationDiagnostics } from './components/NotificationDiagnostics';

export default function NotificationTesterPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { data: currentUser } = useCurrentUser();
    const { confirm, ConfirmDialog } = useConfirm();

    const isAdmin = currentUser?.role === 'Admin' || import.meta.env.DEV;

    // Redirect mobile users away - page is web/desktop only
    useEffect(() => {
        if (isMobile) {
            navigate('/inbox', { replace: true });
        }
    }, [isMobile, navigate]);

    const defaultRecipient = currentUser?.email || currentUser?.sapUser || '';

    // Business & server state managed via custom TanStack Query hook
    const {
        typesQuery,
        registeredTypes,
        lastResult,
        pingMutation,
        createTypeMutation,
        deleteTypeMutation,
        sendMutation,
        isAnyPending,
    } = useNotificationTester();

    // Form inputs state
    const [endpoint, setEndpoint] = useState('/v2/Notification.svc/Notifications');
    const [notificationTypeKey, setNotificationTypeKey] = useState('CNMA_TASK_NOTIFICATION');
    const [notificationTypeVersion, setNotificationTypeVersion] = useState('1.0');
    const [title, setTitle] = useState('Test Push Notification from CNMA Approval App');
    const [description, setDescription] = useState('This is a test push notification sent via SAP_Notifications destination.');
    const [recipientId, setRecipientId] = useState('');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Neutral'>('High');

    // Currently deleting ID for inline row spinner
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Handlers
    const handlePing = () => {
        pingMutation.mutate();
    };

    const handleRefreshTypes = () => {
        void typesQuery.refetch();
    };

    const handleRegisterType = () => {
        createTypeMutation.mutate({
            key: notificationTypeKey.trim() || 'CNMA_TASK_NOTIFICATION',
            version: notificationTypeVersion.trim() || '1.0',
        });
    };

    const handleDeleteType = async (item: ParsedNotificationType) => {
        const ok = await confirm({
            title: t('notificationTester.deleteDialogTitle', 'Delete Notification Type'),
            description: t('notificationTester.deleteConfirm', {
                key: item.key,
                version: item.version,
            }),
            confirmLabel: t('common.delete', 'Delete'),
            cancelLabel: t('common.cancel', 'Cancel'),
            destructive: true,
        });
        if (!ok) return;

        setDeletingId(item.id);
        deleteTypeMutation.mutate(
            { id: item.id, version: item.version },
            {
                onSettled: () => setDeletingId(null),
            }
        );
    };

    const handleSelectType = (item: ParsedNotificationType) => {
        setNotificationTypeKey(item.key);
        setNotificationTypeVersion(item.version);
    };

    const handleSendNotification = () => {
        const effectiveRecipient = recipientId.trim() || defaultRecipient || 'CURRENT_USER';
        sendMutation.mutate({
            endpoint: endpoint.trim() || '/v2/Notification.svc/Notifications',
            originId: 'CNMA_APPROVAL',
            notificationTypeKey: notificationTypeKey.trim() || 'CNMA_TASK_NOTIFICATION',
            notificationTypeVersion: notificationTypeVersion.trim() || '1.0',
            priority,
            title: title.trim() || 'Test Push Notification from CNMA Approval App',
            description: `${description.trim()} (Sent at: ${new Date().toLocaleTimeString()})`,
            recipientId: effectiveRecipient,
        });
    };

    // Non-admin fallback view
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-96 p-8 text-center">
                <Shield className="size-16 text-destructive mb-4" />
                <h2 className="text-xl font-bold text-foreground">
                    {t('notificationTester.accessDeniedTitle')}
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    {t('notificationTester.accessDeniedDesc')}
                </p>
                <Button onClick={() => navigate('/inbox')} className="mt-6" variant="outline">
                    {t('notificationTester.back')}
                </Button>
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-y-auto bg-background">
            {/* Topbar Header */}
            <NotificationHeader
                isPinging={pingMutation.isPending}
                isRefreshing={typesQuery.isFetching}
                onPing={handlePing}
                onRefresh={handleRefreshTypes}
            />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto w-full px-6 py-6 space-y-6 pb-20">
                {/* 3 Metric/Info Cards */}
                <NotificationCards
                    typesCount={registeredTypes.length}
                    hasLoadedTypes={!typesQuery.isLoading}
                />

                {/* 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column (7 cols): Push Form & Registered Types Table */}
                    <div className="lg:col-span-7 space-y-6">
                        <NotificationDispatchForm
                            endpoint={endpoint}
                            setEndpoint={setEndpoint}
                            notificationTypeKey={notificationTypeKey}
                            setNotificationTypeKey={setNotificationTypeKey}
                            notificationTypeVersion={notificationTypeVersion}
                            setNotificationTypeVersion={setNotificationTypeVersion}
                            recipientId={recipientId}
                            setRecipientId={setRecipientId}
                            title={title}
                            setTitle={setTitle}
                            description={description}
                            setDescription={setDescription}
                            priority={priority}
                            setPriority={setPriority}
                            defaultRecipient={defaultRecipient}
                            isRegistering={createTypeMutation.isPending}
                            isSending={sendMutation.isPending}
                            isDisabled={isAnyPending}
                            onRegister={handleRegisterType}
                            onSend={handleSendNotification}
                        />

                        <NotificationTypesTable
                            types={registeredTypes}
                            activeTypeKey={notificationTypeKey}
                            isRefreshing={typesQuery.isFetching}
                            isDeleting={deleteTypeMutation.isPending}
                            deletingId={deletingId}
                            onRefresh={handleRefreshTypes}
                            onSelectType={handleSelectType}
                            onDeleteType={handleDeleteType}
                        />
                    </div>

                    {/* Right Column (5 cols): Diagnostic & Response Output */}
                    <div className="lg:col-span-5 space-y-6">
                        <NotificationDiagnostics result={lastResult} />
                    </div>
                </div>
            </main>
            {ConfirmDialog}
        </div>
    );
}

