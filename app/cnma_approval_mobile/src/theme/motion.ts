import { cubicBezier, Easing, FadeIn, FadeInDown, ReduceMotion } from 'react-native-reanimated';

/** Durations (ms). UI motion stays under 300ms; screen transitions use the platform default. */
export const duration = { press: 120, fast: 150, base: 250, slow: 400, pulse: 900 } as const;

/** Strong ease-out for UI entering/exiting; never ease-in on UI. */
export const easing = { out: Easing.bezier(0.23, 1, 0.32, 1), inOut: Easing.bezier(0.77, 0, 0.175, 1) } as const;

/** Same curve for Reanimated CSS transitions (`transitionTimingFunction`). */
export const cssEasing = { out: cubicBezier(0.23, 1, 0.32, 1) } as const;

const STAGGER_MS = 40;
/** Later items share the last delay, so a long list never waits on its tail. */
const MAX_STAGGER_STEPS = 6;
const RISE_DISTANCE = 8;

/** Content replacing a skeleton: a short fade (kept under Reduce Motion — it explains the state change). */
export const fadeInContent = FadeIn.duration(duration.base).easing(easing.out);

/** A message the user just sent rising into the thread (chat apps); fade only under Reduce Motion. */
export function messageIn(reduceMotion: boolean) {
    if (reduceMotion) return FadeIn.duration(duration.fast).reduceMotion(ReduceMotion.Never);
    return FadeInDown.duration(duration.base)
        .easing(easing.out)
        .withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] });
}

/**
 * First appearance of list items or blocks: fade + small rise, staggered by index.
 * Under Reduce Motion the rise is dropped and only the fade remains.
 */
export function riseIn(index: number, reduceMotion: boolean) {
    const delay = Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS;
    if (reduceMotion) return FadeIn.duration(duration.base).delay(delay).reduceMotion(ReduceMotion.Never);
    return FadeInDown.duration(duration.base + 50)
        .delay(delay)
        .easing(easing.out)
        .withInitialValues({ opacity: 0, transform: [{ translateY: RISE_DISTANCE }] });
}
