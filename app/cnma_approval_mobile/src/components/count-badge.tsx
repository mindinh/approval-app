import { View } from 'react-native';
import { radius } from '@/theme';
import { ThemedText } from './themed-text';

/** Badge text stays readable but never outgrows its icon: system badges do not scale much either. */
const MAX_FONT_SCALE = 1.3;

/**
 * Small count bubble pinned to the top-right corner of an icon (tab bar Inbox count, active filter count).
 * The ring (`ringColor`) is the surface behind it, so the bubble reads as cut out of the icon.
 */
export function CountBadge({ value, color, textColor, ringColor, offset = { top: -4, right: -10 } }: { value: string | number; color: string; textColor: string; ringColor: string; offset?: { top: number; right: number } }) {
    return (
        <View
            pointerEvents="none"
            style={{
                position: 'absolute',
                ...offset,
                minWidth: 18,
                minHeight: 18,
                paddingHorizontal: 5,
                borderRadius: radius.full,
                borderWidth: 2,
                borderColor: ringColor,
                backgroundColor: color,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <ThemedText maxFontSizeMultiplier={MAX_FONT_SCALE} style={{ fontSize: 10, lineHeight: 12, fontWeight: '700', fontVariant: ['tabular-nums'], color: textColor }}>
                {value}
            </ThemedText>
        </View>
    );
}
