import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/inbox/inbox.api', () => ({ inboxApi: {} }));

import { AttachmentPreviewCard } from '../src/pages/Inbox/components/AttachmentPreviewModal';

function render(fileName: string, mimeType: string) {
    return renderToString(createElement(AttachmentPreviewCard, {
        instanceId: 'task', attachmentId: 'attachment', fileName, mimeType,
        previewUrl: '/preview', downloadUrl: '/download', onClose: () => {},
    }));
}

describe('attachment preview', () => {
    it('preserves image preview', () => {
        const html = render('photo.png', 'image/png');
        expect(html).toContain('<img');
        expect(html).toContain('/preview');
    });

    it.each([
        ['report.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        ['report.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        ['report.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    ])('preserves the download fallback for %s', (fileName, mimeType) => {
        const html = render(fileName, mimeType);
        expect(html).toContain('Download File');
        expect(html).toContain('/download');
    });

    it('preserves native PDF preview', () => {
        const html = render('report.pdf', 'application/pdf');
        expect(html).toContain('<iframe');
        expect(html).toContain('/preview#filename=report.pdf');
    });
});
