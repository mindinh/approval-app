/**
 * Attachment filename helpers shared by the attachments panel and the inbox API client.
 */

/** Remove duplicate extensions: "report.xlsx.xlsx" → "report.xlsx", "doc.xls.xls" → "doc.xls" */
export function cleanFileName(name?: string): string | undefined {
    if (!name) return undefined;
    let clean = name.trim();
    // Strip duplicate consecutive extensions (e.g. .xls.xls -> .xls, .PDF.pdf -> .pdf)
    clean = clean.replace(/\.([a-zA-Z0-9]+)(?:\.\1)+$/i, (_match, ext) => `.${ext.toLowerCase()}`);
    // Handle cross-duplicate extensions (e.g. .xlsx.xls -> .xlsx)
    clean = clean.replace(/\.(xlsx|docx|pptx)\.(xls|doc|ppt)$/i, '.$1');
    // Remove trailing dots
    clean = clean.replace(/\.+$/, '').trim();
    return clean;
}

const EXT_LABEL_MAP: Record<string, string> = {
    pdf: 'PDF',
    doc: 'Word Document',
    docx: 'Word Document',
    xls: 'Excel Spreadsheet',
    xlsx: 'Excel Spreadsheet',
    xlsm: 'Excel Spreadsheet',
    xlsb: 'Excel Spreadsheet',
    csv: 'CSV',
    ppt: 'PowerPoint',
    pptx: 'PowerPoint',
    txt: 'Text File',
    log: 'Text File',
    rtf: 'Rich Text',
    md: 'Markdown',
    odt: 'ODF Text',
    ods: 'ODF Spreadsheet',
    odp: 'ODF Presentation',
    png: 'PNG Image',
    jpg: 'JPEG Image',
    jpeg: 'JPEG Image',
    gif: 'GIF Image',
    webp: 'WebP Image',
    svg: 'SVG Image',
    tif: 'TIFF Image',
    tiff: 'TIFF Image',
    bmp: 'BMP Image',
    ico: 'Icon Image',
    heic: 'HEIC Image',
    heif: 'HEIF Image',
    zip: 'ZIP Archive',
    rar: 'RAR Archive',
    '7z': '7-Zip Archive',
    tar: 'TAR Archive',
    gz: 'GZIP Archive',
    json: 'JSON',
    xml: 'XML',
    html: 'HTML',
    htm: 'HTML',
    css: 'CSS',
    js: 'JavaScript',
    ts: 'TypeScript',
    yaml: 'YAML',
    yml: 'YAML',
    mp3: 'Audio',
    wav: 'Audio',
    mp4: 'Video',
    avi: 'Video',
    mov: 'Video',
};

const MIME_LABEL_MAP: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/x-pdf': 'PDF',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.ms-excel': 'Excel Spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    'application/vnd.oasis.opendocument.text': 'ODF Text',
    'application/vnd.oasis.opendocument.spreadsheet': 'ODF Spreadsheet',
    'application/vnd.oasis.opendocument.presentation': 'ODF Presentation',
    'application/zip': 'ZIP Archive',
    'application/x-zip-compressed': 'ZIP Archive',
    'application/x-rar-compressed': 'RAR Archive',
    'application/vnd.rar': 'RAR Archive',
    'application/x-7z-compressed': '7-Zip Archive',
    'application/gzip': 'GZIP Archive',
    'application/json': 'JSON',
    'application/xml': 'XML',
    'text/plain': 'Text File',
    'text/csv': 'CSV',
    'text/html': 'HTML',
    'text/markdown': 'Markdown',
    'image/png': 'PNG Image',
    'image/jpeg': 'JPEG Image',
    'image/jpg': 'JPEG Image',
    'image/pjpeg': 'JPEG Image',
    'image/gif': 'GIF Image',
    'image/webp': 'WebP Image',
    'image/svg+xml': 'SVG Image',
    'image/bmp': 'BMP Image',
    'image/x-icon': 'Icon Image',
    'message/rfc822': 'Outlook Message',
    'application/vnd.ms-outlook': 'Outlook Message',
};

/** MIME types that carry no information about the real file format. */
const GENERIC_MIME_TYPES = new Set(['application/octet-stream', 'application/x-forcedownload']);

/** Map a MIME type or file name to a short, human-readable label */
export function friendlyFileType(mimeType?: string, fileName?: string): string {
    // Strip parameters (e.g. "application/pdf; charset=utf-8" -> "application/pdf")
    const cleanMime = (mimeType || '').split(';')[0].toLowerCase().trim();

    // 1. Direct match with clean MIME type
    if (cleanMime && !GENERIC_MIME_TYPES.has(cleanMime) && MIME_LABEL_MAP[cleanMime]) {
        return MIME_LABEL_MAP[cleanMime];
    }

    // 2. Extension matching from fileName
    if (fileName) {
        const cleanName = (cleanFileName(fileName) || fileName).replace(/\.+$/, '').trim();
        const parts = cleanName.split('?')[0].split('#')[0].split('.');
        if (parts.length > 1) {
            const ext = parts.pop()?.toLowerCase().trim();
            if (ext && EXT_LABEL_MAP[ext]) {
                return EXT_LABEL_MAP[ext];
            }
            if (ext && ext.length >= 2 && ext.length <= 5 && /^[a-z0-9]+$/.test(ext)) {
                return `${ext.toUpperCase()} File`;
            }
        }
    }

    // 3. Category matching based on MIME prefix
    if (cleanMime && !GENERIC_MIME_TYPES.has(cleanMime)) {
        if (cleanMime.startsWith('image/')) {
            const subtype = cleanMime.split('/')[1].replace('+xml', '').toUpperCase();
            return `${subtype} Image`;
        }
        if (cleanMime.startsWith('text/')) {
            return 'Text File';
        }
        if (cleanMime.startsWith('audio/')) {
            return 'Audio File';
        }
        if (cleanMime.startsWith('video/')) {
            return 'Video File';
        }
        return MIME_LABEL_MAP[cleanMime] || mimeType!;
    }

    return 'File';
}

