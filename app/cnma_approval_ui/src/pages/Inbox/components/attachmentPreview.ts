/**
 * Attachment preview helpers — decide which inline preview strategy an attachment supports.
 * Restricted strictly to PDF, plain text, and simple images.
 */

export type PreviewKind = 'image' | 'pdf' | 'txt' | 'none';

const EXTENSION_MIME_TYPES: Record<string, string> = {
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

/** MIME types that carry no content information (the server just forces a download). */
const GENERIC_MIME_TYPES = ['application/octet-stream', 'application/x-forcedownload'];

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'];

const PDF_MIME_TYPES = ['application/pdf', 'application/x-pdf'];

const TEXT_MIME_TYPES = [
    'text/plain',
    'text/csv',
    'text/markdown',
    'text/log',
    'text/html',
    'application/json',
    'application/xml',
    'text/xml',
];

const TEXT_EXTENSIONS = ['.txt', '.csv', '.log', '.json', '.xml', '.md'];

const isGenericMime = (mime: string): boolean => !mime || GENERIC_MIME_TYPES.includes(mime);

const hasExtension = (fileName: string, extensions: string[]): boolean =>
    extensions.some((ext) => fileName.endsWith(ext));

function getMimeTypeFromExtension(fileName?: string): string | undefined {
    if (!fileName) return undefined;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return EXTENSION_MIME_TYPES[ext || ''];
}

/**
 * Determines which preview strategy to use for a given MIME type or filename.
 */
export function getPreviewKind(mimeType?: string, fileName?: string): PreviewKind {
    let mime = (mimeType || '').split(';')[0].toLowerCase().trim();
    const cleanFileName = (fileName || '').toLowerCase().split('?')[0].split('#')[0];

    // If mime is generic or empty, resolve it from the file name extension
    if (isGenericMime(mime)) {
        const resolvedMime = getMimeTypeFromExtension(cleanFileName);
        if (resolvedMime) {
            mime = resolvedMime;
        }
    }

    // Simple Images → native <img>
    if (mime.startsWith('image/') || hasExtension(cleanFileName, IMAGE_EXTENSIONS)) {
        return 'image';
    }

    // PDF → native <iframe>
    if (PDF_MIME_TYPES.includes(mime) || cleanFileName.endsWith('.pdf')) {
        return 'pdf';
    }

    // Plain text, log, csv, json, xml, markdown → TextViewer
    if (TEXT_MIME_TYPES.includes(mime) || hasExtension(cleanFileName, TEXT_EXTENSIONS)) {
        return 'txt';
    }

    // If cleanFileName has no extension and MIME is generic, default to 'pdf' so iframe can attempt stream preview
    const ext = cleanFileName.replace(/\.+$/, '').split('.').pop()?.toLowerCase();
    const hasKnownExt = ext && ext !== cleanFileName && ext.length >= 2;
    if (!hasKnownExt && isGenericMime(mime)) {
        return 'pdf';
    }

    // All other file types (Word, Excel, PowerPoint, ZIP, unknown) -> none
    return 'none';
}

/**
 * Returns true ONLY if an attachment can be previewed (PDF, Plain Text, or Simple Images).
 */
export function isPreviewableType(mimeType?: string, fileName?: string): boolean {
    const kind = getPreviewKind(mimeType, fileName);
    return kind === 'pdf' || kind === 'image' || kind === 'txt';
}
