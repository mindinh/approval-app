/** Matches POST /tasks/:id/comments validation, including serialized mention tags. */
export const COMMENT_MAX_LENGTH = 255;

export function getCommentDraftState(draft: string) {
    const text = draft.trim();
    return {
        text,
        length: text.length,
        exceedsLimit: text.length > COMMENT_MAX_LENGTH,
        canSend: text.length > 0 && text.length <= COMMENT_MAX_LENGTH,
    };
}
