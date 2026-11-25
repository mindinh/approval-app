import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { fadeInContent, radius, spacing, useColors } from '@/theme';
import { Icon } from './icon';
import { ThemedText } from './themed-text';

/**
 * Inline message in a sheet (offline, a failed or unclear write): icon, title and text on a soft tint of its
 * tone. Announced by screen readers when it appears.
 */
export function Notice({ tone, icon, title, message }: { tone: 'warning' | 'danger' | 'info'; icon: Parameters<typeof Icon>[0]['name']; title: string; message: string }) {
    const colors = useColors();
    const foreground = tone === 'danger' ? colors.danger : tone === 'warning' ? colors.warning : colors.info;
    const background = tone === 'danger' ? colors.dangerSoft : tone === 'warning' ? colors.warningSoft : colors.infoSoft;
    return (
        <Animated.View entering={fadeInContent} accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.smd, borderRadius: radius.md, borderCurve: 'continuous', backgroundColor: background }}>
            <Icon name={icon} size={16} color={foreground} />
            <View style={{ flex: 1, gap: 2 }}>
                <ThemedText variant="footnote" style={{ color: foreground, fontWeight: '600' }}>
                    {title}
                </ThemedText>
                <ThemedText variant="footnote" style={{ color: colors.label }}>
                    {message}
                </ThemedText>
            </View>
        </Animated.View>
    );
}
