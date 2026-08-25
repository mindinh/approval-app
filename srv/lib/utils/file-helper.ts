/**
 * Decodes OData attachment content string (hex, base64, or data-uri) into a Buffer.
 * Ensures robust format parsing outside of strategies.
 */
export function decodeAttachmentContent(fileContent: string): Buffer {
    let cleanContent = fileContent.trim().replace(/[\r\n\s]/g, '');
    const dataUriMatch = cleanContent.match(/^data:.*?;base64,(.*)$/i);
    if (dataUriMatch) {
        cleanContent = dataUriMatch[1];
    }

    const isEven = cleanContent.length % 2 === 0;
    const isHex = /^[0-9a-fA-F]+$/.test(cleanContent);

    if (isEven && isHex) {
        const rawBytes = Buffer.from(cleanContent, 'hex');
        const hexString = rawBytes.toString('base64');
        if (hexString.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(hexString)) {
            return Buffer.from(hexString, 'hex');
        } else {
            return rawBytes;
        }
    } else {
        return Buffer.from(cleanContent, 'base64');
    }
}

/**
 * Detects MIME type and file extension from raw Buffer magic bytes.
 */
export function detectMimeFromBuffer(buffer: Buffer): { mimeType: string; extension: string } | null {
    if (!buffer || buffer.length < 4) return null;

    // PDF: %PDF (0x25 0x50 0x44 0x46)
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
        return { mimeType: 'application/pdf', extension: 'pdf' };
    }

    // PNG: \x89PNG (0x89 0x50 0x4E 0x47)
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return { mimeType: 'image/png', extension: 'png' };
    }

    // JPEG: 0xFF 0xD8 0xFF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return { mimeType: 'image/jpeg', extension: 'jpg' };
    }

    // GIF: GIF87a or GIF89a (0x47 0x49 0x46 0x38)
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
        return { mimeType: 'image/gif', extension: 'gif' };
    }

    // WebP: RIFF....WEBP
    if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
        return { mimeType: 'image/webp', extension: 'webp' };
    }

    // ZIP / Office XML: PK\x03\x04 (0x50 0x4B 0x03 0x04)
    if (buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
        return { mimeType: 'application/zip', extension: 'zip' };
    }

    return null;
}

export const MIME_TYPE_MAP: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    txt: 'text/plain',
    log: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    htm: 'text/html',
    md: 'text/markdown',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ppt: 'application/vnd.ms-powerpoint',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    msg: 'application/vnd.ms-outlook',
};

export const EXT_FROM_MIME: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'application/json': 'json',
    'application/xml': 'xml',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xls',
    'application/zip': 'zip',
};


