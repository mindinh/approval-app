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
