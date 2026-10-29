import { describe, expect, it, vi } from 'vitest';
import { bindScrollPagination } from '@/pages/Inbox/hooks/scrollPagination';

class ScrollContainer extends EventTarget {
    scrollTop = 0;
    clientHeight = 600;
    scrollHeight = 650;
}

describe('scroll-driven pagination', () => {
    it.each(['wheel', 'touch'])('does not carry a %s gesture into another category', input => {
        const container = new ScrollContainer();
        const load = vi.fn();
        let category = 'PR';
        const cleanup = bindScrollPagination(container as unknown as HTMLDivElement, load, () => category);
        if (input === 'wheel') container.dispatchEvent(new WheelEventShim(25));
        else {
            container.dispatchEvent(Object.assign(new Event('touchstart'), { touches: [{ clientY: 100 }] }));
            container.dispatchEvent(Object.assign(new Event('touchmove'), { touches: [{ clientY: 50 }] }));
        }
        category = 'PO';
        container.scrollTop = 25;
        container.dispatchEvent(new Event('scroll'));
        expect(load).not.toHaveBeenCalled();
        container.dispatchEvent(new WheelEventShim(25));
        container.scrollTop = 50;
        container.dispatchEvent(new Event('scroll'));
        expect(load).toHaveBeenCalledTimes(1);
        cleanup();
    });
    it('does not load on mount, layout changes, or programmatic scroll without input', () => {
        const container = new ScrollContainer();
        const load = vi.fn();
        const cleanup = bindScrollPagination(container as unknown as HTMLDivElement, load);
        container.scrollTop = 50;
        container.dispatchEvent(new Event('scroll'));
        expect(load).not.toHaveBeenCalled();
        cleanup();
    });

    it('loads at most once for an input, even when the bottom stays visible after render', () => {
        const container = new ScrollContainer();
        const load = vi.fn();
        const cleanup = bindScrollPagination(container as unknown as HTMLDivElement, load);
        container.dispatchEvent(new WheelEventShim(25));
        container.scrollTop = 25;
        container.dispatchEvent(new Event('scroll'));
        container.scrollTop = 30;
        container.dispatchEvent(new Event('scroll'));
        expect(load).toHaveBeenCalledTimes(1);
        container.dispatchEvent(new WheelEventShim(25));
        container.scrollTop = 50;
        container.dispatchEvent(new Event('scroll'));
        expect(load).toHaveBeenCalledTimes(2);
        cleanup();
        container.dispatchEvent(new WheelEventShim(25));
        container.scrollTop = 60;
        container.dispatchEvent(new Event('scroll'));
        expect(load).toHaveBeenCalledTimes(2);
    });

    it('ignores upward scrolling', () => {
        const container = new ScrollContainer();
        container.scrollTop = 50;
        const load = vi.fn();
        const cleanup = bindScrollPagination(container as unknown as HTMLDivElement, load);
        container.dispatchEvent(new WheelEventShim(-25));
        container.scrollTop = 25;
        container.dispatchEvent(new Event('scroll'));
        expect(load).not.toHaveBeenCalled();
        cleanup();
    });

    it('supports touch and keyboard scrolling near the bottom', () => {
        const container = new ScrollContainer();
        const load = vi.fn();
        const cleanup = bindScrollPagination(container as unknown as HTMLDivElement, load);
        container.dispatchEvent(Object.assign(new Event('touchstart'), { touches: [{ clientY: 100 }] }));
        container.dispatchEvent(Object.assign(new Event('touchmove'), { touches: [{ clientY: 50 }] }));
        container.scrollTop = 25;
        container.dispatchEvent(new Event('scroll'));
        expect(load).toHaveBeenCalledTimes(1);
        container.dispatchEvent(Object.assign(new Event('keydown'), { key: 'PageDown', shiftKey: false }));
        container.scrollTop = 50;
        container.dispatchEvent(new Event('scroll'));
        expect(load).toHaveBeenCalledTimes(2);
        cleanup();
    });

    it('does not load far from the bottom and disarms when another control is clicked', () => {
        const container = new ScrollContainer();
        container.scrollHeight = 4000;
        const load = vi.fn();
        const cleanup = bindScrollPagination(container as unknown as HTMLDivElement, load);
        container.dispatchEvent(new WheelEventShim(25));
        container.scrollTop = 25;
        container.dispatchEvent(new Event('scroll'));
        expect(load).not.toHaveBeenCalled();
        const control = new EventTarget();
        const pointer = new Event('pointerdown');
        Object.defineProperty(pointer, 'target', { value: control });
        container.dispatchEvent(pointer);
        container.scrollTop = 3400;
        container.dispatchEvent(new Event('scroll'));
        expect(load).not.toHaveBeenCalled();
        cleanup();
    });
});

class WheelEventShim extends Event {
    constructor(public deltaY: number) { super('wheel'); }
}
