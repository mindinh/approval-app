import { attachmentPath, isInsideFolder, safeFileName, sniffFileKind, statusOfDownloadError } from '@/lib/api/attachments';
import { isViewerImage, knownExtension } from '@/utils/file-types';

const bytes = (...values: (number | string)[]) => Uint8Array.from(values.flatMap((value) => (typeof value === 'string' ? [...value].map((char) => char.charCodeAt(0)) : [value])));

describe('attachmentPath', () => {
    it('asks the BFF for a download with the document id and type', () => {
        expect(attachmentPath({ id: 'FOL 1/2' }, { documentId: '4500000123', businessObjectType: 'BUS2012', sapOrigin: 'S4H' })).toBe(
            '/tasks/attachments/FOL%201%2F2/content?disposition=attachment&documentId=4500000123&objectType=BUS2012&sapOrigin=S4H'
        );
    });

    it('leaves out empty context values', () => {
        expect(attachmentPath({ id: '7' }, { documentId: '', businessObjectType: '', sapOrigin: 'LOCAL' })).toBe('/tasks/attachments/7/content?disposition=attachment&sapOrigin=LOCAL');
    });
});

describe('knownExtension', () => {
    it('recognizes extensions the OS viewers understand', () => {
        expect(knownExtension('Quote 2026.PDF')).toBe('pdf');
        expect(knownExtension('Prices.xlsx')).toBe('xlsx');
    });

    it('ignores names without one, or with a dot that is not an extension', () => {
        expect(knownExtension('Bao gia')).toBe('');
        expect(knownExtension('Contract v2.05')).toBe('');
        expect(knownExtension('attachment_123')).toBe('');
    });
});

describe('sniffFileKind', () => {
    it('detects common types from the first bytes', () => {
        expect(sniffFileKind(bytes('%PDF-1.7'))?.extension).toBe('pdf');
        expect(sniffFileKind(bytes(0x89, 'PNG', 0x0d, 0x0a))?.extension).toBe('png');
        expect(sniffFileKind(bytes(0xff, 0xd8, 0xff, 0xe0))?.extension).toBe('jpg');
        expect(sniffFileKind(bytes('RIFF', 0, 0, 0, 0, 'WEBP'))?.extension).toBe('webp');
    });

    it('tells Office files apart from plain ZIP archives', () => {
        expect(sniffFileKind(bytes('PK', 3, 4, '....xl/workbook.xml'))?.extension).toBe('xlsx');
        expect(sniffFileKind(bytes('PK', 3, 4, '....word/document.xml'))?.extension).toBe('docx');
        expect(sniffFileKind(bytes('PK', 3, 4, '....ppt/slides'))?.extension).toBe('pptx');
        expect(sniffFileKind(bytes('PK', 3, 4, '....photos/a.jpg'))?.extension).toBe('zip');
    });

    it('returns null for unknown or too short content', () => {
        expect(sniffFileKind(bytes('hello world'))).toBeNull();
        expect(sniffFileKind(bytes('%P'))).toBeNull();
    });
});

describe('safeFileName', () => {
    it('replaces characters that are not allowed in file names', () => {
        expect(safeFileName('a/b:c?.txt')).toBe('a_b_c_.txt');
        expect(safeFileName('   ')).toBe('attachment');
    });
});

describe('statusOfDownloadError', () => {
    it('reads the HTTP status from the download error', () => {
        expect(statusOfDownloadError(new Error('Unable to download file: status code 401'))).toBe(401);
        expect(statusOfDownloadError(new Error('The Internet connection appears to be offline.'))).toBeUndefined();
    });
});

describe('isInsideFolder (image viewer guard)', () => {
    const folder = 'file:///data/cache/attachments';
    it('accepts files the app downloaded', () => {
        expect(isInsideFolder('file:///data/cache/attachments/FOL1/photo.jpg', folder)).toBe(true);
    });

    it('rejects other folders, path traversal and other schemes', () => {
        expect(isInsideFolder('file:///data/documents/secret.jpg', folder)).toBe(false);
        expect(isInsideFolder('file:///data/cache/attachments/../tokens.json', folder)).toBe(false);
        expect(isInsideFolder('file:///data/cache/attachments/%2E%2E/tokens.json', folder)).toBe(false);
        expect(isInsideFolder('https://evil.example/data/cache/attachments/x.jpg', folder)).toBe(false);
        expect(isInsideFolder('', folder)).toBe(false);
    });
});

describe('isViewerImage', () => {
    it('sends photos to the in-app viewer and documents to Quick Look', () => {
        expect(isViewerImage('JPG')).toBe(true);
        expect(isViewerImage('heic')).toBe(true);
        expect(isViewerImage('pdf')).toBe(false);
        expect(isViewerImage('xlsx')).toBe(false);
    });
});
