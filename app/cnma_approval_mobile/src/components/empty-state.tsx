import type { SymbolViewProps } from 'expo-symbols';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { radius, spacing, useColors } from '@/theme';
import { Icon } from './icon';
import { ThemedText } from './themed-text';

const ICON_BUBBLE = 64;

/** Centered icon, title and message (plus an optional action) for empty or not-yet-available content. */
export function EmptyState({
    icon,
    tint,
    title,
    message,
    action,
}: {
    icon: SymbolViewProps['name'];
    tint: { foreground: string; background: string };
    title: string;
    message?: string;
    action?: ReactNode;
}) {
    const colors = useColors();
    return (
        <View
            style={{
                alignItems: 'center',
                gap: spacing.smd,
                paddingVertical: spacing.xl,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.card,
                borderCurve: 'continuous',
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.cardBorder,
            }}
        >
            <View style={{ width: ICON_BUBBLE, height: ICON_BUBBLE, borderRadius: radius.full, backgroundColor: tint.background, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={icon} size={30} color={tint.foreground} />
            </View>
            <View style={{ alignItems: 'center', gap: spacing.xs }}>
                <ThemedText variant="headline" style={{ textAlign: 'center' }}>
                    {title}
                </ThemedText>
                {message ? (
                    <ThemedText variant="subhead" style={{ textAlign: 'center' }}>
                        {message}
                    </ThemedText>
                ) : null}
            </View>
            {action}
        </View>
    );
}
