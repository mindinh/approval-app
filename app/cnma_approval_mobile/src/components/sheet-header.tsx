import { Pressable, View } from 'react-native';
import { ThemedText } from './themed-text';
import { radius, spacing, useColors } from '@/theme';

/**
 * Title row of a form sheet (the native header is hidden there): optional leading action (e.g. Reset),
 * centered title, Done on the right.
 */
export function SheetHeader({ title, onDone, leading }: { title: string; onDone: () => void; leading?: { label: string; onPress: () => void; disabled?: boolean } }) {
    const colors = useColors();
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingTop: spacing.sm }}>
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
                {leading ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !!leading.disabled }}
                        disabled={leading.disabled}
                        onPress={leading.onPress}
                        hitSlop={12}
                        style={({ pressed }) => ({
                            paddingHorizontal: spacing.sm,
                            paddingVertical: spacing.xs,
                            borderRadius: radius.sm,
                            backgroundColor: pressed ? colors.fillBackground : 'transparent',
                        })}
                    >
                        <ThemedText variant="body" style={{ color: leading.disabled ? colors.tertiaryLabel : colors.accent }}>
                            {leading.label}
                        </ThemedText>
                    </Pressable>
                ) : null}
            </View>
            <ThemedText variant="headline" accessibilityRole="header">
                {title}
            </ThemedText>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Pressable
                    accessibilityRole="button"
                    onPress={onDone}
                    hitSlop={12}
                    style={({ pressed }) => ({ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, backgroundColor: pressed ? colors.fillBackground : 'transparent' })}
                >
                    <ThemedText variant="headline" style={{ color: colors.accent }}>
                        Done
                    </ThemedText>
                </Pressable>
            </View>
        </View>
    );
}
