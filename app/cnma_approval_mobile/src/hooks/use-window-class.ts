import { useWindowDimensions } from 'react-native';

/** Material window size classes (width in dp): phones are compact, unfolded/small tablets medium. */
export type WindowClass = 'compact' | 'medium' | 'expanded';

const MEDIUM_MIN_WIDTH = 600;
const EXPANDED_MIN_WIDTH = 840;

export function windowClassFor(width: number): WindowClass {
    if (width >= EXPANDED_MIN_WIDTH) return 'expanded';
    return width >= MEDIUM_MIN_WIDTH ? 'medium' : 'compact';
}

/** Re-evaluates on rotation, split view and fold/unfold. Layouts expand; they never change features. */
export function useWindowClass(): WindowClass {
    return windowClassFor(useWindowDimensions().width);
}
