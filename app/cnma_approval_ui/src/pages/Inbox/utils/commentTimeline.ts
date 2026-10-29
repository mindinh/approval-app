import { isValid, parseISO } from 'date-fns';

/** SAP wall times stay local; timestamps with an offset use the viewer's calendar day. */
function parseCommentDay(value?: string): Date | null {
    if (!value?.trim()) return null;
    const date = parseISO(value.trim().replace(' ', 'T'));
    return isValid(date) ? date : null;
}

export function isSameCommentDay(day: Date | null, other: Date | null): boolean {
    return Boolean(day && other
        && day.getFullYear() === other.getFullYear()
        && day.getMonth() === other.getMonth()
        && day.getDate() === other.getDate());
}

/** Keep API ordering; insert a divider only when the calendar day changes. */
export function buildCommentTimeline<T extends { createdAt?: string }>(comments: readonly T[]) {
    let previousDay: Date | null = null;
    return comments.map((comment, index) => {
        const day = parseCommentDay(comment.createdAt);
        const startsDay = index === 0 || (day === null || previousDay === null
            ? day !== previousDay : !isSameCommentDay(day, previousDay));
        previousDay = day;
        return { comment, day, startsDay };
    });
}
