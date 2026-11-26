import { View } from 'react-native';

/** Size of the corner glow (it fades out well inside this box). */
const GLOW_WIDTH = 180;
const GLOW_HEIGHT = 120;

/**
 * Soft glow of a color in the top-right corner of a card, behind the status: a hint of the task's category
 * without a stripe or a shape. Put it first inside a card with `overflow: 'hidden'` so it follows the
 * rounded corner.
 */
export function CornerGlow({ color }: { color: string }) {
    return (
        <View
            pointerEvents="none"
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: GLOW_WIDTH,
                height: GLOW_HEIGHT,
                experimental_backgroundImage: `radial-gradient(ellipse at top right, ${color}24 0%, ${color}0D 45%, ${color}00 75%)`,
            }}
        />
    );
}
