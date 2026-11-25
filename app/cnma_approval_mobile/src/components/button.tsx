import { ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import { radius, spacing, useColors } from '@/theme';
import { PressableScale } from './pressable-scale';
import { ThemedText } from './themed-text';

type Variant = 'primary' | 'secondary' | 'destructive';

/** Filled button with press-scale feedback. */
export function Button({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
}: {
    title: string;
    onPress?: () => void;
    variant?: Variant;
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
}) {
    const colors = useColors();
    const inactive = disabled || loading;
    const background = variant === 'primary' ? colors.accentFill : colors.fillBackground;
    const foreground = variant === 'primary' ? colors.onAccent : variant === 'destructive' ? colors.danger : colors.label;

    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityState={{ disabled: inactive, busy: loading }}
            disabled={inactive}
            onPress={onPress}
            style={[
                {
                    minHeight: 50,
                    paddingHorizontal: spacing.md,
                    borderRadius: radius.md,
                    borderCurve: 'continuous',
                    backgroundColor: background,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: inactive ? 0.5 : 1,
                },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={foreground as string} />
            ) : (
                <ThemedText variant="headline" style={{ color: foreground }}>
                    {title}
                </ThemedText>
            )}
        </PressableScale>
    );
}
