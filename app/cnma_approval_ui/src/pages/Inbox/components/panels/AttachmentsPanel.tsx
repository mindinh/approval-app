/**
 * AttachmentsPanel — file attachment list with download and preview capabilities.
 */
import { useState } from 'react';
import {
    Download,
    Eye,
    FileText,
    Image as ImageIcon,
    File,
    Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@cnma/react-ui';
import type { TaskDetail } from '@/services/inbox/inbox.types';
import { AttachmentPreviewCard, isPreviewableType } from '../AttachmentPreviewModal';
import { inboxApi } from '@/services/inbox/inbox.api';
import { formatDate, safe } from '@/pages/Inbox/utils/formatters';
import { formatFileSize } from '@/renderers/TaskDetailSections.shared';
import { cleanFileName, friendlyFileType, Empty } from '@/pages/Inbox/utils/shared';
import { cn } from '@/lib/utils';
import { toast } from '@cnma/react-ui';

/** File-type icon for mobile attachment cards */
function FileIcon({ mimeType, fileName }: { mimeType?: string; fileName?: string }) {
    const mime = (mimeType || '').split(';')[0].toLowerCase().trim();
    const ext = (fileName || '').split('?')[0].split('#')[0].split('.').pop()?.toLowerCase();

    if (mime.startsWith('image/') || (ext && ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext))) {
        return <ImageIcon className="size-5" />;
    }
    if (mime === 'application/pdf' || mime === 'application/x-pdf' || ext === 'pdf' || mime.startsWith('text/') || (ext && ['txt', 'log', 'csv', 'json', 'xml', 'md'].includes(ext))) {
        return <FileText className="size-5" />;
    }
    return <File className="size-5" />;
}

export function AttachmentsPanel({
    detail,
    isMobile = false,
    isPrLoading = false,
    isSecLoading = false,
}: {
    detail: TaskDetail;
    isMobile?: boolean;
    isPrLoading?: boolean;
    isSecLoading?: boolean;
}) {
    const [previewAttachment, setPreviewAttachment] = useState<{
        id: string;
        fileName?: string;
        mimeType?: string;
    } | null>(null);
    const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null);
    const instanceId = detail?.task?.instanceId || detail?.instanceId || '';
    const isPreviewOpen = !!previewAttachment;

    const documentNumber = detail?.task?.businessContext?.documentId || detail?.documentId || '';
    const sapOrigin = detail?.task?.sapOrigin || 'LOCAL';

    // Use attachments from consolidated detail directly
    const displayedAttachments = detail.attachments || [];
    const isLoading = isPrLoading || (isSecLoading && displayedAttachments.length === 0);

    const getPreviewUrl = (attachmentId: string, fileName?: string) => {
        return inboxApi.getAttachmentContentUrl(attachmentId, documentNumber, sapOrigin, 'inline', fileName);
    };

    const getDownloadUrl = (attachmentId: string, fileName?: string) => {
        return inboxApi.getAttachmentContentUrl(attachmentId, documentNumber, sapOrigin, 'attachment', fileName);
    };

    const handleDownload = async (attachmentId: string, defaultFileName: string) => {
        setDownloadingAttachmentId(attachmentId);
        const toastId = toast.loading('Preparing file for download...');
        try {
            const { data, fileName: returnedFileName } = await inboxApi.downloadAttachment(
                attachmentId,
                documentNumber,
                sapOrigin
            );

            const fileName = returnedFileName || defaultFileName || 'download';
            const url = URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            toast.success('Download completed successfully.', { id: toastId });
        } catch (error: any) {
            console.error('Failed to download attachment:', error);
            toast.error(error.message || 'Failed to download attachment.', { id: toastId });
        } finally {
            setDownloadingAttachmentId(null);
        }
    };

    return (
        <div className={cn(
            isMobile ? 'w-full space-y-4' : 'flex gap-4 items-stretch w-full min-w-0 overflow-hidden h-full'
        )}>
            <div className={cn(
                'transition-all duration-300 ease-in-out shrink-0 flex flex-col min-h-0 min-w-0',
                isPreviewOpen && !isMobile ? 'w-80' : 'w-full'
            )}>
                {isMobile ? (
                    /* ── Mobile: SAP My Requests–style attachment list ── */
                    <div className="space-y-3">
                        {/* Attachment count header */}
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">
                            {isLoading ? 'Loading...' : `${displayedAttachments.length} ${displayedAttachments.length === 1 ? 'ATTACHMENT' : 'ATTACHMENTS'}`}
                        </p>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                                <Loader2 className="size-5 animate-spin text-primary/80" />
                                <p className="text-xs text-muted-foreground">Loading attachments...</p>
                            </div>
                        ) : displayedAttachments.length === 0 ? (
                            <Empty message="No files attached." />
                        ) : (
                            displayedAttachments.map((attachment) => {
                                const fileName = safe(cleanFileName(attachment.fileName) || cleanFileName(attachment.fileDisplayName) || attachment.id);
                                const fileType = friendlyFileType(attachment.mimeType, fileName);
                                const fileSize = formatFileSize(attachment.fileSize);
                                const author = safe(attachment.createdByName || attachment.createdBy);
                                const date = formatDate(attachment.createdAt);
                                const canPreview = isPreviewableType(attachment.mimeType, fileName);
                                const previewUrl = canPreview ? getPreviewUrl(attachment.id, fileName) : undefined;

                                return (
                                    <div
                                        key={attachment.id}
                                        className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* File type icon */}
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-destructive/10 text-destructive">
                                                <FileIcon mimeType={attachment.mimeType} fileName={fileName} />
                                            </div>

                                            {/* File info */}
                                            <div className="flex-1 min-w-0 space-y-0.5">
                                                <p className="text-sm font-semibold text-foreground truncate">
                                                    {fileName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {fileType} · {fileSize}
                                                </p>
                                                {(author || date) && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {author && `By ${author}`}{author && date && ' • '}{date}
                                                    </p>
                                                )}
                                                {canPreview && previewUrl && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => window.open(previewUrl, '_blank')}
                                                        className="text-xs font-semibold mt-1 flex items-center gap-1 text-primary h-auto p-0 hover:bg-transparent"
                                                    >
                                                        <Eye className="size-3" />
                                                        Tap to view
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Download icon */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    handleDownload(attachment.id, fileName);
                                                }}
                                                disabled={downloadingAttachmentId === attachment.id}
                                                className="shrink-0 size-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                            >
                                                {downloadingAttachmentId === attachment.id ? (
                                                    <Loader2 className="size-5 animate-spin" />
                                                ) : (
                                                    <Download className="size-5" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    /* ── Desktop: original card layout ── */
                    <Card className="gap-0 bg-card border-border/70 shadow-sm h-full flex flex-col min-h-0">
                        <CardHeader className="shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Attachments</CardTitle>
                                    <CardDescription>Files and links attached to this task</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto pb-4 space-y-2 flex flex-col min-h-0">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3 flex-1">
                                    <Loader2 className="size-6 animate-spin text-primary/80" />
                                    <p className="text-xs text-muted-foreground font-medium">Loading attachments...</p>
                                </div>
                            ) : displayedAttachments.length === 0 ? (
                                <Empty message="No files attached." />
                            ) : (
                                displayedAttachments.map((attachment) => (
                                    <div
                                        key={attachment.id}
                                        className={cn(
                                            'rounded-md border p-3 transition-colors',
                                            isPreviewOpen ? 'space-y-2' : 'flex items-start justify-between gap-3',
                                            previewAttachment?.id === attachment.id
                                                ? 'border-primary/40 bg-primary/10'
                                                : 'border-border/60 hover:bg-muted/30'
                                        )}
                                    >
                                        <div className="min-w-0 space-y-1 flex-1">
                                            <div className="font-medium truncate text-sm">
                                                {safe(cleanFileName(attachment.fileName) || cleanFileName(attachment.fileDisplayName) || attachment.id)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {friendlyFileType(attachment.mimeType, attachment.fileName || attachment.fileDisplayName)} · {formatFileSize(attachment.fileSize)}
                                            </div>
                                        </div>
                                        <div className={cn(
                                            'flex items-center gap-1.5 shrink-0',
                                            isPreviewOpen && 'flex-wrap'
                                        )}>
                                            {isPreviewableType(attachment.mimeType, attachment.fileName || attachment.fileDisplayName) && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (isPreviewOpen && previewAttachment?.id !== attachment.id) return;
                                                        if (previewAttachment?.id === attachment.id) {
                                                            setPreviewAttachment(null);
                                                        } else {
                                                            setPreviewAttachment({
                                                                id: attachment.id,
                                                                fileName: attachment.fileName || attachment.fileDisplayName,
                                                                mimeType: attachment.mimeType,
                                                            });
                                                        }
                                                    }}
                                                    disabled={isPreviewOpen && previewAttachment?.id !== attachment.id}
                                                    className={cn(
                                                        'inline-flex items-center gap-1 px-2 py-1.5 h-auto font-medium transition-colors',
                                                        previewAttachment?.id === attachment.id
                                                            ? 'border-primary/40 bg-primary/10 text-primary'
                                                            : isPreviewOpen
                                                                ? 'border-border/40 text-muted-foreground/40 bg-muted/20 cursor-not-allowed opacity-50'
                                                                : 'border-border/60 text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                                                    )}
                                                >
                                                    <Eye className="size-3.5" />
                                                    {previewAttachment?.id === attachment.id ? 'Close' : 'View'}
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const fName = cleanFileName(attachment.fileName) || cleanFileName(attachment.fileDisplayName) || attachment.id;
                                                    handleDownload(attachment.id, fName);
                                                }}
                                                disabled={downloadingAttachmentId === attachment.id}
                                                className="inline-flex items-center gap-1 border border-border/60 px-2 py-1.5 h-auto font-medium text-muted-foreground hover:bg-primary/5 hover:text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                                            >
                                                {downloadingAttachmentId === attachment.id ? (
                                                    <Loader2 className="size-3.5 animate-spin" />
                                                ) : (
                                                    <Download className="size-3.5" />
                                                )}
                                                {downloadingAttachmentId === attachment.id ? 'Preparing...' : 'Download'}
                                            </Button>
                                        </div>
                                        {!isPreviewOpen && (
                                            <div className="text-xs text-muted-foreground shrink-0 text-right">
                                                <div>{formatDate(attachment.createdAt)}</div>
                                                <div>{safe(attachment.createdByName || attachment.createdBy)}</div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                            {isSecLoading && displayedAttachments.length > 0 && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="size-6 animate-spin text-primary/80" />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {!isMobile && (
                <AnimatePresence>
                    {previewAttachment && (
                        <motion.div
                            key={previewAttachment.id}
                            className="flex-1 min-w-0 overflow-hidden"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 40 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            <AttachmentPreviewCard
                                instanceId={instanceId}
                                attachmentId={previewAttachment.id}
                                fileName={previewAttachment.fileName}
                                mimeType={previewAttachment.mimeType}
                                previewUrl={getPreviewUrl(previewAttachment.id, previewAttachment.fileName)}
                                downloadUrl={getDownloadUrl(previewAttachment.id, previewAttachment.fileName)}
                                onClose={() => setPreviewAttachment(null)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}
