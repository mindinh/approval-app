import { View } from 'react-native';
import { radius, useColors } from '@/theme';
import { ThemedText } from './themed-text';

function initialsOf(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    const letters = words.length > 1 ? [words[0][0], words[words.length - 1][0]] : [name.trim()[0] ?? '?'];
    return letters.join('').toUpperCase();
}

/**
 * Initials avatar. `accent` (the signed-in user) is a soft teal disc with teal initials;
 * `neutral` (other people, e.g. requesters) is a quiet grey disc.
 */
export function Avatar({ name, size = 52, tone = 'accent' }: { name: string; size?: number; tone?: 'accent' | 'neutral' }) {
    const colors = useColors();
    const accent = tone === 'accent';
    return (
        <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ width: size, height: size, borderRadius: radius.full, backgroundColor: accent ? colors.accentSoft : colors.fillBackground, alignItems: 'center', justifyContent: 'center' }}
        >
            <ThemedText variant="headline" style={{ color: accent ? colors.accent : colors.secondaryLabel, fontSize: size * 0.38, lineHeight: size * 0.5 }}>
                {initialsOf(name)}
            </ThemedText>
        </View>
    );
}
