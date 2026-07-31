/**
 * Utility for resolving MIME types from file extension or file name.
 */

const EXTENSION_TO_MIME: Record<string, string> = {
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xlsm: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xlsb: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    text: 'text/plain',
    log: 'text/plain',
    rtf: 'application/rtf',
    md: 'text/markdown',

    // OpenOffice / LibreOffice
    odt: 'application/vnd.oasis.opendocument.text',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
    odp: 'application/vnd.oasis.opendocument.presentation',

    // Images
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    tif: 'image/tiff',
    tiff: 'image/tiff',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    heic: 'image/heic',
    heif: 'image/heif',

    // Archives
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    tgz: 'application/gzip',

    // Web / Data
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    htm: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    ts: 'text/plain',
    yaml: 'application/x-yaml',
    yml: 'application/x-yaml',

    // Audio / Video
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime'
};

export function getMimeTypeFromExtension(ext?: string, fileName?: string): string {
    let resolvedExt = (ext || '').toLowerCase().trim().replace(/^\./, '');

    if (!resolvedExt && fileName) {
        const parts = fileName.split('.');
        if (parts.length > 1) {
            resolvedExt = parts[parts.length - 1].toLowerCase().trim();
        }
    }

    if (resolvedExt && EXTENSION_TO_MIME[resolvedExt]) {
        return EXTENSION_TO_MIME[resolvedExt];
    }

    return 'application/octet-stream';
}
