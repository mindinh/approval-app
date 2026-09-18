import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
    Badge,
} from '@cnma/react-ui';
import {
    Bell,
    Send,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Globe,
    Shield,
    Copy,
    Check,
    Radio,
    Terminal,
    ListOrdered,
    PlusCircle,
} from 'lucide-react';
import {
    notificationApi,
    type NotificationTestResponse,
    type SendNotificationPayload,
} from '@/services/notification/notification.api';
import { useCurrentUser } from '@/pages/Inbox/hooks/inboxQueries';

interface NotificationTestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NotificationTestModal: React.FC<NotificationTestModalProps> = ({
    open,
    onOpenChange,
}) => {
    const { data: currentUser } = useCurrentUser();
    const defaultRecipient = currentUser?.email || currentUser?.sapUser || '';

    const [isLoading, setIsLoading] = useState(false);
    const [activeAction, setActiveAction] = useState<'check' | 'send' | 'types' | 'create' | null>(null);
    const [result, setResult] = useState<NotificationTestResponse | null>(null);
    const [copied, setCopied] = useState(false);

    // Notification payload state
    const [endpoint, setEndpoint] = useState('/v2/Notification.svc/Notifications');
    const [notificationTypeKey, setNotificationTypeKey] = useState('CNMA_TASK_NOTIFICATION');
    const [title, setTitle] = useState('Test Push Notification from CNMA Approval App');
    const [description, setDescription] = useState('This is a test push notification sent via SAP_Notifications destination.');
    const [recipientId, setRecipientId] = useState('');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Neutral'>('High');

    const handleTestDestination = async () => {
        setIsLoading(true);
        setActiveAction('check');
        try {
            const data = await notificationApi.testDestination();
            setResult(data);
        } catch (error: any) {
            setResult({
                success: false,
                message: error?.response?.data?.message || error?.message || 'Failed to connect to destination',
                details: JSON.stringify(error?.response?.data || error?.message, null, 2),
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetNotificationTypes = async () => {
        setIsLoading(true);
        setActiveAction('types');
        try {
            const data = await notificationApi.getNotificationTypes();
            setResult(data);
        } catch (error: any) {
            setResult({
                success: false,
                message: error?.response?.data?.message || error?.message || 'Failed to fetch notification types',
                details: JSON.stringify(error?.response?.data || error?.message, null, 2),
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateNotificationType = async () => {
        setIsLoading(true);
        setActiveAction('create');
        try {
            const data = await notificationApi.createNotificationType(
                notificationTypeKey.trim() || 'CNMA_TASK_NOTIFICATION',
                '1.0'
            );
            setResult(data);
        } catch (error: any) {
            setResult({
                success: false,
                message: error?.response?.data?.message || error?.message || 'Failed to register notification type',
                details: JSON.stringify(error?.response?.data || error?.message, null, 2),
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendNotification = async () => {
        setIsLoading(true);
        setActiveAction('send');
        try {
            const effectiveRecipient = recipientId.trim() || defaultRecipient || 'CURRENT_USER';
            const payload: SendNotificationPayload = {
                endpoint: endpoint.trim() || '/v2/Notification.svc/Notifications',
                originId: 'CNMA_APPROVAL',
                notificationTypeKey: notificationTypeKey.trim() || 'CNMA_TASK_NOTIFICATION',
                notificationTypeVersion: '1.0',
                priority,
                title: title.trim() || 'Test Push Notification from CNMA Approval App',
                description: `${description.trim()} (Sent at: ${new Date().toLocaleTimeString()})`,
                recipientId: effectiveRecipient,
            };
            const data = await notificationApi.sendTestNotification(payload);
            setResult(data);
        } catch (error: any) {
            setResult({
                success: false,
                message: error?.response?.data?.message || error?.message || 'Failed to dispatch notification',
                details: JSON.stringify(error?.response?.data || error?.message, null, 2),
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyDetails = () => {
        if (!result?.details) return;
        void navigator.clipboard.writeText(result.details);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-0 overflow-hidden border border-border bg-card text-card-foreground shadow-2xl">
                {/* Header */}
                <DialogHeader className="p-5 border-b border-border bg-muted/40">
                    <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Bell className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold leading-tight">
                                Push Notification Tester
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Test destination <span className="font-mono font-medium text-foreground bg-muted px-1.5 py-0.5 rounded">SAP_Notifications</span> & BTP Notification Service
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
                    {/* Destination Info Box */}
                    <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Radio className="size-3.5 text-primary" /> Target Destination
                            </span>
                            <Badge variant="outline" className="text-xs font-mono">
                                SAP_Notifications
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Sends push notifications to SAP BTP Notification Service (<code className="text-primary font-mono">{endpoint}</code>).
                        </p>
                    </div>

                    {/* Parameters form */}
                    <div className="rounded-lg border border-border p-3.5 space-y-3 bg-card">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Notification Configuration
                        </h4>
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                                        API Endpoint
                                    </label>
                                    <input
                                        type="text"
                                        value={endpoint}
                                        onChange={(e) => setEndpoint(e.target.value)}
                                        placeholder="/v2/Notification.svc/Notifications"
                                        className="w-full text-xs font-mono rounded-md border border-input bg-background px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                                        Notification Type Key
                                    </label>
                                    <input
                                        type="text"
                                        value={notificationTypeKey}
                                        onChange={(e) => setNotificationTypeKey(e.target.value)}
                                        placeholder="e.g. CNMA_TASK_NOTIFICATION"
                                        className="w-full text-xs font-mono rounded-md border border-input bg-background px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                                        Recipient ID (Email / User ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={recipientId}
                                        onChange={(e) => setRecipientId(e.target.value)}
                                        placeholder={defaultRecipient ? `Default: ${defaultRecipient}` : 'Enter recipient ID'}
                                        className="w-full text-xs rounded-md border border-input bg-background px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                                        Priority
                                    </label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as any)}
                                        className="w-full text-xs rounded-md border border-input bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary h-[31px]"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Neutral">Neutral</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">
                                    Title (Property: Title)
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Test Push Notification"
                                    className="w-full text-xs rounded-md border border-input bg-background px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">
                                    Description (Property: Description)
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Notification content..."
                                    className="w-full text-xs rounded-md border border-input bg-background px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Trigger Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <Button
                            variant="outline"
                            onClick={handleTestDestination}
                            disabled={isLoading}
                            className="h-10 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            {isLoading && activeAction === 'check' ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Globe className="size-3.5 text-primary" />
                            )}
                            <span className="truncate">Check Dest</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleGetNotificationTypes}
                            disabled={isLoading}
                            className="h-10 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Query registered Notification Types from BTP"
                        >
                            {isLoading && activeAction === 'types' ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <ListOrdered className="size-3.5 text-primary" />
                            )}
                            <span className="truncate">Get Types</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleCreateNotificationType}
                            disabled={isLoading}
                            className="h-10 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Register Notification Type (Template) in BTP Notification Service"
                        >
                            {isLoading && activeAction === 'create' ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <PlusCircle className="size-3.5 text-primary" />
                            )}
                            <span className="truncate">Register Type</span>
                        </Button>

                        <Button
                            variant="default"
                            onClick={handleSendNotification}
                            disabled={isLoading}
                            className="h-10 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            {isLoading && activeAction === 'send' ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Send className="size-3.5" />
                            )}
                            <span className="truncate">Send Push</span>
                        </Button>
                    </div>

                    {/* Result Panel */}
                    {result && (
                        <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
                            {/* Status header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {result.success ? (
                                        <CheckCircle2 className="size-4 text-success" />
                                    ) : (
                                        <AlertCircle className="size-4 text-destructive" />
                                    )}
                                    <span className="text-xs font-bold text-foreground">
                                        {result.success ? 'Success' : 'Failed'}
                                    </span>
                                </div>
                                {result.authentication && (
                                    <Badge variant="outline" className="text-[11px] font-mono flex items-center gap-1">
                                        <Shield className="size-3 text-muted-foreground" />
                                        {result.authentication}
                                    </Badge>
                                )}
                            </div>

                            {/* Message */}
                            <p className="text-xs text-foreground font-medium bg-background/80 p-2.5 rounded border border-border/60">
                                {result.message}
                            </p>

                            {/* URL info */}
                            {result.url && (
                                <div className="text-xs flex items-center gap-1.5 text-muted-foreground">
                                    <Globe className="size-3.5 shrink-0" />
                                    <span className="font-mono truncate text-[11px]" title={result.url}>
                                        {result.url}
                                    </span>
                                </div>
                            )}

                            {/* JSON Details */}
                            {result.details && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                                            <Terminal className="size-3" /> Diagnostic Details
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleCopyDetails}
                                            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="size-3 text-success" /> Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="size-3" /> Copy JSON
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <pre className="text-[11px] font-mono bg-background p-2.5 rounded border border-border max-h-44 overflow-y-auto text-muted-foreground whitespace-pre-wrap break-all">
                                        {result.details}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="p-3 border-t border-border bg-muted/40 flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="cursor-pointer text-xs"
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
