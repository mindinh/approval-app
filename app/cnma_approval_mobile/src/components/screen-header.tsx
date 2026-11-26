import { View } from 'react-native';
import { spacing } from '@/theme';
import { AccountButton } from './account-button';
import { ThemedText } from './themed-text';

/**
 * In-content header of a tab screen: optional eyebrow (e.g. today's date), a large title, an optional
 * subtitle, and the profile avatar on the right. Replaces the native header bar on tab roots.
 */
export function ScreenHeader({ title, eyebrow, subtitle }: { title: string; eyebrow?: string; subtitle?: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xs }}>
            <View style={{ flex: 1, gap: 2 }}>
                {eyebrow ? (
                    <ThemedText variant="caption" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
                        {eyebrow}
                    </ThemedText>
                ) : null}
                <ThemedText variant="screenTitle" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} accessibilityRole="header">
                    {title}
                </ThemedText>
                {subtitle ? <ThemedText variant="subhead">{subtitle}</ThemedText> : null}
            </View>
            <AccountButton />
        </View>
    );
}
