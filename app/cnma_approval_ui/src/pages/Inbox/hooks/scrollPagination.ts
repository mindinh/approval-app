/** Load at most one page per downward user gesture, never from layout changes. */
export function bindScrollPagination(container: HTMLDivElement, load: () => void, getContext: () => string = () => ''): () => void {
    let armed = false;
    let inputContext = getContext();
    let lastTop = container.scrollTop;
    let touchY: number | undefined;
    const wheel = (event: WheelEvent) => { inputContext = getContext(); armed = event.deltaY > 0; };
    const touchStart = (event: TouchEvent) => { inputContext = getContext(); touchY = event.touches[0]?.clientY; armed = false; };
    const touchMove = (event: TouchEvent) => {
        const nextY = event.touches[0]?.clientY;
        armed = inputContext === getContext() && nextY !== undefined && touchY !== undefined && nextY < touchY;
        touchY = nextY;
    };
    const keyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        if (target?.matches?.('input, textarea, select, [contenteditable="true"]')) return;
        inputContext = getContext();
        armed = ['ArrowDown', 'PageDown', 'End', ' '].includes(event.key) && !event.shiftKey;
    };
    // Support dragging the native scrollbar as well as wheel/touch/keyboard input.
    const pointerDown = (event: PointerEvent) => {
        inputContext = getContext();
        armed = event.target === container;
    };
    const scroll = () => {
        const top = container.scrollTop;
        const movingDown = top > lastTop;
        lastTop = top;
        if (inputContext !== getContext()) { armed = false; return; }
        if (!armed || !movingDown) return;
        if (container.scrollHeight - top - container.clientHeight > 100) return;
        armed = false;
        load();
    };
    const clear = () => { armed = false; };
    container.addEventListener('wheel', wheel, { passive: true });
    container.addEventListener('touchstart', touchStart, { passive: true });
    container.addEventListener('touchmove', touchMove, { passive: true });
    container.addEventListener('keydown', keyDown);
    container.addEventListener('pointerdown', pointerDown);
    container.addEventListener('scroll', scroll, { passive: true });
    container.addEventListener('focusout', clear);
    return () => {
        container.removeEventListener('wheel', wheel);
        container.removeEventListener('touchstart', touchStart);
        container.removeEventListener('touchmove', touchMove);
        container.removeEventListener('keydown', keyDown);
        container.removeEventListener('pointerdown', pointerDown);
        container.removeEventListener('scroll', scroll);
        container.removeEventListener('focusout', clear);
    };
}
