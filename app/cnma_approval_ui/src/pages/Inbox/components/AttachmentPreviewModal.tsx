import { Download, FileText, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@cnma/react-ui';
import { inboxApi } from '@/services/inbox/inbox.api';
import { useState, lazy, Suspense } from 'react';
import { toast } from '@cnma/react-ui';
import { DocxViewer } from './DocxViewer';
import { ExcelViewer } from './ExcelViewer';
import { TextViewer } from './TextViewer';

// Lazy-load react-doc-viewer to avoid bundling it upfront
const DocViewer = lazy(() => import('@cyntler/react-doc-viewer'));

// We need to import renderers separately
let DocViewerRenderers: unknown[] = [];
import('@cyntler/react-doc-viewer').then((mod) => {
    DocViewerRenderers = mod.DocViewerRenderers || [];
});

interface AttachmentPreviewCardProps {
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
 * - react-doc-viewer for Office documents (docx, xlsx, pptx)
 * - Fallback download prompt for unsupported types
 */
export function AttachmentPreviewCard({
    instanceId,
    attachmentId,
    fileName,
    mimeType,
    onClose,
    previewUrl: customPreviewUrl,
    downloadUrl: customDownloadUrl,
}: AttachmentPreviewCardProps) {
    const previewUrl = customPreviewUrl || inboxApi.getAttachmentContentUrl(attachmentId, undefined, undefined, 'inline');
    const downloadUrl = customDownloadUrl || inboxApi.getAttachmentContentUrl(attachmentId, undefined, undefined, 'attachment');
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

                {(previewKind === 'pdf' || previewKind === 'iframe') && (
                    <iframe
                        src={previewUrl}
                        title={displayName}
                        className="w-full h-full border-0 bg-white"
                    />
                )}

                {previewKind === 'docx' && (
                    <DocxViewer url={previewUrl} />
                )}

                {previewKind === 'xlsx' && (
                    <ExcelViewer url={previewUrl} />
                )}

                {previewKind === 'docviewer' && (
                    <DocViewerPreview url={previewUrl} fileName={displayName} mimeType={mimeType} />
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
                    onClick={() => setZoom((z) => Math.max(25, z - 25))}
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
                    onClick={() => setZoom((z) => Math.min(400, z + 25))}
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
                    onClick={() => {
                        const toastId = toast.loading('Preparing file for download...');
                        window.setTimeout(() => toast.dismiss(toastId), 1500);
                    }}
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

/* ─── DocViewer for Office documents ───────────────────────────── */

function DocViewerPreview({
    url,
    fileName,
    mimeType,
}: {
    url: string;
    fileName: string;
    mimeType?: string;
}) {
    const docs = [
        {
            uri: url,
            fileName: fileName,
            fileType: mimeTypeToFileType(mimeType),
        },
    ];

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Loading document viewer…
                </div>
            }
        >
            <DocViewer
                documents={docs}
                pluginRenderers={DocViewerRenderers as never}
                config={{
                    header: {
                        disableHeader: true,
                        disableFileName: true,
                    },
                }}
                style={{ width: '100%', height: '100%', background: 'white' }}
            />
        </Suspense>
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
                onClick={() => {
                    const toastId = toast.loading('Preparing file for download...');
                    window.setTimeout(() => toast.dismiss(toastId), 1500);
                }}
            >
                <Button size="sm" className="gap-1.5 mt-1">
                    <Download className="size-3.5" />
                    Download File
                </Button>
            </a>
        </div>
    );
}

/* ─── Helpers ──────────────────────────────────────────────────── */

type PreviewKind = 'image' | 'pdf' | 'txt' | 'iframe' | 'docx' | 'xlsx' | 'docviewer' | 'none';

function getMimeTypeFromExtension(fileName?: string): string | undefined {
    if (!fileName) return undefined;
    const ext = fileName.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xls': 'application/vnd.ms-excel',
        'csv': 'text/csv',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'txt': 'text/plain',
        'log': 'text/plain',
        'md': 'text/plain',
        'json': 'application/json',
        'xml': 'application/xml',
        'html': 'text/html',
        'htm': 'text/html',
    };
    return map[ext || ''];
}

/**
 * Determines which preview strategy to use for a given MIME type.
 */
function getPreviewKind(mimeType?: string, fileName?: string): PreviewKind {
    let mime = (mimeType || '').toLowerCase();

    // If mime is generic or empty, resolve it from the file name extension
    if (!mime || mime === 'application/octet-stream' || mime === 'application/x-forcedownload') {
        const resolvedMime = getMimeTypeFromExtension(fileName);
        if (resolvedMime) {
            mime = resolvedMime;
        }
    }

    if (!mime) return 'none';

    // Images → native <img>
    if (mime.startsWith('image/')) return 'image';

    // PDF → client-side pdfjs viewer
    if (mime === 'application/pdf') return 'pdf';

    // Plain text, log, csv, json, xml, markdown → TextViewer
    if (
        mime === 'text/plain' ||
        mime === 'text/csv' ||
        mime === 'text/markdown' ||
        mime === 'text/log' ||
        mime === 'text/html' ||
        mime === 'application/json' ||
        mime === 'application/xml' ||
        mime === 'text/xml'
    ) {
        return 'txt';
    }

    return 'none';
}

const OFFICE_MIME_TYPES = new Set([
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
    'text/csv',
]);

/**
 * Returns true if the browser/react-doc-viewer can render this MIME type.
 * Used by the attachment list to show/hide the "View" button.
 */
export function isPreviewableType(mimeType?: string, fileName?: string): boolean {
    const kind = getPreviewKind(mimeType, fileName);
    return kind !== 'none';
}

/**
 * Maps a MIME type to a simple file extension for react-doc-viewer.
 */
function mimeTypeToFileType(mimeType?: string): string | undefined {
    if (!mimeType) return undefined;
    const map: Record<string, string> = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'application/vnd.oasis.opendocument.text': 'odt',
        'application/vnd.oasis.opendocument.spreadsheet': 'ods',
        'application/vnd.oasis.opendocument.presentation': 'odp',
        'text/csv': 'csv',
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg',
    };
    return map[mimeType.toLowerCase()];
}
