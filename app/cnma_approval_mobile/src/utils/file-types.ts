/** File types the OS viewers understand, by MIME type and by extension (pure: shared by the detail mapping and downloads). */

/** Extension per MIME type (metadata fallback). */
export const EXTENSION_BY_MIME: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/heic': 'heic',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'text/html': 'html',
    'application/rtf': 'rtf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/zip': 'zip',
    'message/rfc822': 'eml',
};

export const MIME_BY_EXTENSION: Record<string, string> = Object.fromEntries([...Object.entries(EXTENSION_BY_MIME).map(([mime, ext]) => [ext, mime]), ['jpeg', 'image/jpeg'], ['tif', 'image/tiff'], ['htm', 'text/html'], ['msg', 'application/vnd.ms-outlook']]);

export interface FileKind {
    extension: string;
    mimeType: string;
}

/** Lower-case extension of a file name when it is one we know, else ''. */
export function knownExtension(fileName: string): string {
    const match = /\.([a-z0-9]{2,5})$/i.exec(fileName.trim());
    const extension = match ? match[1].toLowerCase() : '';
    return MIME_BY_EXTENSION[extension] ? extension : '';
}

/** MIME type for a known extension, else application/octet-stream. */
export function mimeOfExtension(extension: string): string {
    return MIME_BY_EXTENSION[extension.toLowerCase()] ?? 'application/octet-stream';
}

/** Image types shown in the in-app image viewer (Quick Look hides its controls on images). */
const VIEWER_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'heic', 'webp', 'bmp', 'tiff', 'tif']);

export function isViewerImage(extension: string): boolean {
    return VIEWER_IMAGE_EXTENSIONS.has(extension.toLowerCase());
}
