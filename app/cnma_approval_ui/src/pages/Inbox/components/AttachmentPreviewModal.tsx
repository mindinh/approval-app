import { Download, FileText, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@cnma/react-ui';
import { inboxApi } from '@/services/inbox/inbox.api';
import { useState } from 'react';
import { toast } from '@cnma/react-ui';
import { TextViewer } from './TextViewer';
import { getPreviewKind } from './attachmentPreview';

const MIN_ZOOM_PERCENT = 25;
const MAX_ZOOM_PERCENT = 400;
const ZOOM_STEP_PERCENT = 25;
const DOWNLOAD_TOAST_DURATION_MS = 1500;

/** Brief feedback while the browser starts the native download. */
function showDownloadStartingToast() {
    const toastId = toast.loading('Preparing file for download...');
    window.setTimeout(() => toast.dismiss(toastId), DOWNLOAD_TOAST_DURATION_MS);
}

interface AttachmentPreviewCardProps {
    /** Accepted for caller compatibility; content URLs are resolved by attachment ID. */
    instanceId: string;
    attachmentId: string;
    fileName?: string;
    mimeType?: string;
    previewUrl?: string;
    downloadUrl?: string;
    onClose: () => void;
}

/**
 * AttachmentPreviewCard — Inline card for the right side of the Attachments tab.
 *
 * Features:
 * - Native <img> for images with zoom/rotate controls
 * - Native <iframe> for PDF and plain text
 * - Fallback download prompt for unsupported types
 */
export function AttachmentPreviewCard({
    attachmentId,
    fileName,
    mimeType,
    onClose,
    previewUrl: customPreviewUrl,
    downloadUrl: customDownloadUrl,
}: AttachmentPreviewCardProps) {
    const previewUrl = customPreviewUrl || inboxApi.getAttachmentContentUrl(attachmentId, undefined, undefined, 'inline', fileName);
    const downloadUrl = customDownloadUrl || inboxApi.getAttachmentContentUrl(attachmentId, undefined, undefined, 'attachment', fileName);
    const displayName = fileName || attachmentId;
    const previewKind = getPreviewKind(mimeType, fileName);

    return (
        <Card className="w-full min-w-0 max-w-full gap-0 bg-card border-border/70 shadow-md overflow-hidden flex flex-col h-full relative">
            <Button
                variant="outline"
                size="icon"
                className="absolute top-3 right-5 z-10 size-8 rounded-full shadow-sm bg-card/85 backdrop-blur-md border-border text-muted-foreground hover:text-destructive hover:bg-muted"
                onClick={onClose}
                title="Close preview"
            >
                <X className="size-4" />
            </Button>

            <CardContent className="w-full min-w-0 max-w-full flex-1 min-h-0 p-0 overflow-hidden bg-muted/30 relative">
                {previewKind === 'image' && (
                    <ImagePreview src={previewUrl} alt={displayName} downloadUrl={downloadUrl} />
                )}

                {previewKind === 'txt' && (
                    <TextViewer url={previewUrl} fileName={displayName} />
                )}

                {previewKind === 'pdf' && (
                    <iframe
                        src={`${previewUrl}#filename=${encodeURIComponent(displayName)}&title=${encodeURIComponent(displayName)}`}
                        title={displayName}
                        className="w-full h-full border-0 bg-white"
                    />
                )}

                {previewKind === 'none' && (
                    <FallbackPreview
                        displayName={displayName}
                        mimeType={mimeType}
                        downloadUrl={downloadUrl}
                        fileName={fileName}
                    />
                )}
            </CardContent>
        </Card>
    );
}

/* ─── Image Preview with zoom & rotate ─────────────────────────── */

function ImagePreview({ src, alt, downloadUrl }: { src: string; alt: string; downloadUrl: string }) {
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);

    return (
        <div className="relative w-full h-full flex flex-col">
            {/* Toolbar */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-lg bg-card/90 backdrop-blur-md border border-border shadow-sm px-1.5 py-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setZoom((z) => Math.max(MIN_ZOOM_PERCENT, z - ZOOM_STEP_PERCENT))}
                    title="Zoom out"
                >
                    <ZoomOut className="size-3.5" />
                </Button>
                <span className="text-xs font-medium text-muted-foreground min-w-[3ch] text-center tabular-nums">
                    {zoom}%
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setZoom((z) => Math.min(MAX_ZOOM_PERCENT, z + ZOOM_STEP_PERCENT))}
                    title="Zoom in"
                >
                    <ZoomIn className="size-3.5" />
                </Button>
                <div className="w-px h-4 bg-border mx-0.5" />
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    title="Rotate"
                >
                    <RotateCw className="size-3.5" />
                </Button>
                <div className="w-px h-4 bg-border mx-0.5" />
                <a
                    href={downloadUrl}
                    download
                    onClick={showDownloadStartingToast}
                >
                    <Button variant="ghost" size="icon" className="size-7" title="Download">
                        <Download className="size-3.5" />
                    </Button>
                </a>
            </div>

            {/* Image area */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#fff_0%_50%)] bg-[length:20px_20px]">
                <img
                    src={src}
                    alt={alt}
                    className="transition-transform duration-200 ease-out shadow-sm rounded-md border border-border"
                    style={{
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                        maxWidth: zoom <= 100 ? '100%' : 'none',
                        maxHeight: zoom <= 100 ? '100%' : 'none',
                        objectFit: 'contain',
                    }}
                    draggable={false}
                />
            </div>
        </div>
    );
}

/* ─── Fallback for unsupported types ───────────────────────────── */

function FallbackPreview({
    displayName,
    mimeType,
    downloadUrl,
    fileName,
}: {
    displayName: string;
    mimeType?: string;
    downloadUrl: string;
    fileName?: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
            <div className="flex items-center justify-center size-16 rounded-xl bg-white border border-border/60 shadow-sm">
                <FileText className="size-8 text-muted-foreground/30" />
            </div>
            <div className="space-y-1">
                <h4 className="text-sm font-medium text-foreground">{displayName}</h4>
                <p className="text-xs text-muted-foreground">
                    Preview is not available for this file type.
                </p>
                {mimeType && (
                    <Badge variant="outline" className="text-xs mt-1.5">{mimeType}</Badge>
                )}
            </div>
            <a
                href={downloadUrl}
                download={fileName}
                onClick={showDownloadStartingToast}
            >
                <Button size="sm" className="gap-1.5 mt-1">
                    <Download className="size-3.5" />
                    Download File
                </Button>
            </a>
        </div>
    );
}
