import { describe, it, expect } from 'vitest';
import { cleanFileName, friendlyFileType } from '@/pages/Inbox/utils/shared';
import { isPreviewableType } from '@/pages/Inbox/components/AttachmentPreviewModal';

describe('cleanFileName', () => {
    it('returns undefined for undefined', () => {
        expect(cleanFileName(undefined)).toBeUndefined();
    });

    it('returns name unchanged when no duplicate extension', () => {
        expect(cleanFileName('report.xlsx')).toBe('report.xlsx');
    });

    it('removes duplicate extension (same case)', () => {
        expect(cleanFileName('report.xlsx.xlsx')).toBe('report.xlsx');
    });

    it('removes duplicate extension (different case)', () => {
        expect(cleanFileName('report.PDF.pdf')).toBe('report.pdf');
    });

    it('preserves different extensions', () => {
        expect(cleanFileName('report.bak.xlsx')).toBe('report.bak.xlsx');
    });

    it('handles filenames without extensions', () => {
        expect(cleanFileName('readme')).toBe('readme');
    });

    it('handles filenames with multiple dots', () => {
        expect(cleanFileName('my.report.v2.xlsx')).toBe('my.report.v2.xlsx');
    });
});

describe('friendlyFileType', () => {
    it('returns File for undefined or empty inputs without extension', () => {
        expect(friendlyFileType(undefined)).toBe('File');
        expect(friendlyFileType('')).toBe('File');
        expect(friendlyFileType('application/octet-stream')).toBe('File');
    });

    it('maps application/pdf to PDF', () => {
        expect(friendlyFileType('application/pdf')).toBe('PDF');
    });

    it('handles MIME types with parameters', () => {
        expect(friendlyFileType('application/pdf; charset=utf-8')).toBe('PDF');
    });

    it('maps excel MIME type', () => {
        expect(friendlyFileType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe('Excel Spreadsheet');
    });

    it('maps image/png', () => {
        expect(friendlyFileType('image/png')).toBe('PNG Image');
    });

    it('falls back to file extension when MIME is application/octet-stream', () => {
        expect(friendlyFileType('application/octet-stream', 'document.docx')).toBe('Word Document');
        expect(friendlyFileType('application/octet-stream', 'invoice.pdf')).toBe('PDF');
        expect(friendlyFileType('', 'image.png')).toBe('PNG Image');
        expect(friendlyFileType('application/octet-stream', 'data.csv')).toBe('CSV');
    });

    it('formats unmapped extension as UPPERCASE File', () => {
        expect(friendlyFileType('application/octet-stream', 'archive.7z')).toBe('7-Zip Archive');
        expect(friendlyFileType('application/octet-stream', 'custom_data.xyz')).toBe('XYZ File');
    });

    it('is case-insensitive', () => {
        expect(friendlyFileType('Application/PDF')).toBe('PDF');
        expect(friendlyFileType('IMAGE/JPEG')).toBe('JPEG Image');
    });
});

describe('isPreviewableType', () => {
    it('allows PDF, plain text, and simple images', () => {
        expect(isPreviewableType('application/pdf', 'doc.pdf')).toBe(true);
        expect(isPreviewableType('image/png', 'photo.png')).toBe(true);
        expect(isPreviewableType('image/jpeg', 'photo.jpg')).toBe(true);
        expect(isPreviewableType('text/plain', 'note.txt')).toBe(true);
        expect(isPreviewableType('text/csv', 'data.csv')).toBe(true);
        expect(isPreviewableType('application/json', 'payload.json')).toBe(true);
        expect(isPreviewableType('application/octet-stream', 'report.pdf')).toBe(true);
        expect(isPreviewableType('application/octet-stream', 'picture.webp')).toBe(true);
    });

    it('disallows Office documents, ZIP archives, and unknown binaries', () => {
        expect(isPreviewableType('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'contract.docx')).toBe(false);
        expect(isPreviewableType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'budget.xlsx')).toBe(false);
        expect(isPreviewableType('application/zip', 'files.zip')).toBe(false);
        expect(isPreviewableType('application/octet-stream', 'archive.rar')).toBe(false);
        expect(isPreviewableType('application/octet-stream', 'unknown.bin')).toBe(false);
    });
});
