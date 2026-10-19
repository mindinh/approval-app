import { describe, expect, it } from 'vitest';
import { buildCommentTimeline, isSameCommentDay } from '@/pages/Inbox/utils/commentTimeline';

describe('comment timeline', () => {
    it('adds one divider per consecutive calendar day without reordering messages', () => {
        const comments = [
            { id: 'a', createdAt: '2026-10-18 08:00:00' },
            { id: 'b', createdAt: '2026-10-18T23:59:59' },
            { id: 'c', createdAt: '2026-10-19T00:00:00' },
        ];
        const timeline = buildCommentTimeline(comments);
        expect(timeline.map(entry => entry.startsDay)).toEqual([true, false, true]);
        expect(timeline.map(entry => entry.comment.id)).toEqual(['a', 'b', 'c']);
        expect(isSameCommentDay(timeline[2].day, new Date(2026, 9, 19, 12))).toBe(true);
        expect(isSameCommentDay(timeline[0].day, new Date(2026, 9, 19))).toBe(false);
    });

    it('uses the viewer calendar date for offset timestamps, including near midnight', () => {
        const instant = '2026-10-18T23:30:00-07:00';
        const date = new Date(instant);
        expect(isSameCommentDay(buildCommentTimeline([{ createdAt: instant }])[0].day, date)).toBe(true);
        const local = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T12:00:00`;
        expect(buildCommentTimeline([{ createdAt: instant }, { createdAt: local }])[1].startsDay).toBe(false);
    });

    it('keeps missing and invalid dates unknown and separates transitions back to a known day', () => {
        const timeline = buildCommentTimeline([
            { createdAt: '' }, { createdAt: 'invalid' }, { createdAt: '2026-02-30' },
            { createdAt: '2026-10-19' }, { createdAt: undefined }, { createdAt: '2026-10-19' },
        ]);
        expect(timeline.map(entry => entry.startsDay)).toEqual([true, false, false, true, true, true]);
        expect(timeline.slice(0, 3).map(entry => entry.day)).toEqual([null, null, null]);
        expect(isSameCommentDay(null, new Date())).toBe(false);
        expect(buildCommentTimeline([])).toEqual([]);
    });
});
