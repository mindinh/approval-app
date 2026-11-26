import { Text, type TextProps } from 'react-native';
import { secondaryTextVariants, type, type TypeVariant, useColors } from '@/theme';

/** Text in a type-ramp variant; primary or secondary label color follows the variant. */
export function ThemedText({ variant = 'body', style, ...props }: TextProps & { variant?: TypeVariant }) {
    const colors = useColors();
    const color = secondaryTextVariants.has(variant) ? colors.secondaryLabel : colors.label;
    return <Text style={[type[variant], { color }, style]} {...props} />;
}
