import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import type { TextProps } from 'react-native';
import { haptics } from '@/lib/haptics';
import { type TypeVariant, useColors } from '@/theme';
import { copiedMessage } from '@/utils/copy';
import { ThemedText } from './themed-text';
import { toast } from './toast';

/**
 * Text that copies itself on long press. The pressed text is highlighted, and a toast says exactly what was
 * copied, instead of the system "Copy" bubble that does not show which text it takes (iOS `selectable`).
 * `copyValue` defaults to the text (pass it when the children are not a plain string); `label` names the field
 * in the toast ("Copied document number: 4400000028"). Not for text inside a Pressable: the text takes the touch.
 */
export function CopyableText({
    copyValue,
    label,
    highlightColor,
    variant,
    style,
    children,
    ...props
}: TextProps & { variant?: TypeVariant; copyValue?: string; label?: string; highlightColor?: string }) {
    const colors = useColors();
    const [pressed, setPressed] = useState(false);
    const value = copyValue ?? (typeof children === 'string' || typeof children === 'number' ? String(children) : '');
    const enabled = value.trim() !== '';

    const copy = async () => {
        haptics.success();
        await Clipboard.setStringAsync(value);
        toast.show(copiedMessage(value, label));
    };

    return (
        <ThemedText
            variant={variant}
            suppressHighlighting
            onPressIn={enabled ? () => setPressed(true) : undefined}
            onPressOut={enabled ? () => setPressed(false) : undefined}
            onLongPress={enabled ? () => void copy() : undefined}
            accessibilityHint={enabled ? 'Double-tap and hold to copy' : undefined}
            style={[style, pressed ? { backgroundColor: highlightColor ?? colors.accentSoft, borderRadius: 4 } : null]}
            {...props}
        >
            {children}
        </ThemedText>
    );
}
