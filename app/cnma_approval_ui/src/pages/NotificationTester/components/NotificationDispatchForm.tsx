import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Badge,
    Input,
    Textarea,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    Label,
} from '@cnma/react-ui';
import { Send, PlusCircle, Loader2 } from 'lucide-react';

interface NotificationDispatchFormProps {
    endpoint: string;
    setEndpoint: (val: string) => void;
    notificationTypeKey: string;
    setNotificationTypeKey: (val: string) => void;
    notificationTypeVersion: string;
    setNotificationTypeVersion: (val: string) => void;
    recipientId: string;
    setRecipientId: (val: string) => void;
    title: string;
    setTitle: (val: string) => void;
    description: string;
    setDescription: (val: string) => void;
    priority: 'Low' | 'Medium' | 'High' | 'Neutral';
    setPriority: (val: 'Low' | 'Medium' | 'High' | 'Neutral') => void;
    defaultRecipient: string;
    isRegistering: boolean;
    isSending: boolean;
    isDisabled: boolean;
    onRegister: () => void;
    onSend: () => void;
}

export const NotificationDispatchForm: React.FC<NotificationDispatchFormProps> = ({
    endpoint,
    setEndpoint,
    notificationTypeKey,
    setNotificationTypeKey,
    notificationTypeVersion,
    setNotificationTypeVersion,
    recipientId,
    setRecipientId,
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    defaultRecipient,
    isRegistering,
    isSending,
    isDisabled,
    onRegister,
    onSend,
}) => {
    const { t } = useTranslation();

    return (
        <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                    <Send className="size-4 text-primary" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                        {t('notificationTester.triggerTitle')}
                    </CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs font-normal">
                    {t('notificationTester.odataPost', 'OData POST')}
                </Badge>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                        <Label className="text-xs font-semibold text-muted-foreground block">
                            {t('notificationTester.endpointLabel')}
                        </Label>
                        <Input
                            type="text"
                            value={endpoint}
                            onChange={(e) => setEndpoint(e.target.value)}
                            placeholder="/v2/Notification.svc/Notifications"
                            className="text-xs font-mono"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-muted-foreground block">
                            {t('notificationTester.priorityLabel')}
                        </Label>
                        <Select
                            value={priority}
                            onValueChange={(val) => setPriority(val as 'Low' | 'Medium' | 'High' | 'Neutral')}
                        >
                            <SelectTrigger className="text-xs w-full h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Low">{t('notificationTester.priorityLow')}</SelectItem>
                                <SelectItem value="Medium">{t('notificationTester.priorityMedium')}</SelectItem>
                                <SelectItem value="High">{t('notificationTester.priorityHigh')}</SelectItem>
                                <SelectItem value="Neutral">{t('notificationTester.priorityNeutral')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-muted-foreground block">
                            {t('notificationTester.typeKeyLabel')}
                        </Label>
                        <Input
                            type="text"
                            value={notificationTypeKey}
                            onChange={(e) => setNotificationTypeKey(e.target.value)}
                            placeholder="e.g. CNMA_TASK_NOTIFICATION"
                            className="text-xs font-mono"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-muted-foreground block">
                            {t('notificationTester.typeVersionLabel')}
                        </Label>
                        <Input
                            type="text"
                            value={notificationTypeVersion}
                            onChange={(e) => setNotificationTypeVersion(e.target.value)}
                            placeholder="e.g. 1.0"
                            className="text-xs font-mono"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground block">
                        {t('notificationTester.recipientLabel')}
                    </Label>
                    <Input
                        type="text"
                        value={recipientId}
                        onChange={(e) => setRecipientId(e.target.value)}
                        placeholder={defaultRecipient ? `${t('common.default', 'Default')}: ${defaultRecipient}` : ''}
                        className="text-xs"
                    />
                    <span className="text-xs text-muted-foreground block">
                        {t('notificationTester.recipientHint')}
                    </span>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground block">
                        {t('notificationTester.titleLabel')}
                    </Label>
                    <Input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-xs"
                    />
                </div>

                <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground block">
                        {t('notificationTester.descriptionLabel')}
                    </Label>
                    <Textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="text-xs resize-none"
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                    <Button
                        variant="outline"
                        onClick={onRegister}
                        disabled={isDisabled || isRegistering}
                        className="text-xs gap-1.5 h-10"
                    >
                        {isRegistering ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <PlusCircle className="size-4 text-primary" />
                        )}
                        <span>{t('notificationTester.registerType')}</span>
                    </Button>

                    <Button
                        variant="default"
                        onClick={onSend}
                        disabled={isDisabled || isSending}
                        className="text-xs gap-1.5 h-10 px-5 font-semibold"
                    >
                        {isSending ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Send className="size-4" />
                        )}
                        <span>{t('notificationTester.sendNotification')}</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
