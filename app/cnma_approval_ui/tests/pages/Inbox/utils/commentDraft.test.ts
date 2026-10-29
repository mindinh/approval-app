import { describe, expect, it } from 'vitest';
import { getCommentDraftState } from '@/pages/Inbox/utils/commentDraft';

describe('comment draft API limit', () => {
    it('allows exactly 255 serialized characters and rejects 256', () => {
        expect(getCommentDraftState('a'.repeat(255))).toMatchObject({ length: 255, canSend: true });
        expect(getCommentDraftState('a'.repeat(256))).toMatchObject({ length: 256, exceedsLimit: true, canSend: false });
    });

    it('counts mention markup and line breaks exactly as submitted', () => {
        const text = '<tag>@Jane Doe</tag>\n' + 'a'.repeat(235);
        expect(getCommentDraftState(text)).toMatchObject({ length: 256, canSend: false });
    });

    it('trims only outer whitespace and rejects empty drafts', () => {
        expect(getCommentDraftState(' \n ')).toMatchObject({ length: 0, canSend: false });
        expect(getCommentDraftState(' \nHello\nthere ')).toMatchObject({ text: 'Hello\nthere', length: 11, canSend: true });
    });

    it('uses the same UTF-16 length as backend validation for emoji', () => {
        expect(getCommentDraftState('😀'.repeat(128))).toMatchObject({ length: 256, canSend: false });
    });
});
