import { isReferencePrField } from '@approval-core/status-predicates';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { CopyableText } from '@/components/copyable-text';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { haptics } from '@/lib/haptics';
import { spacing, useColors } from '@/theme';

/** Treats "-", "", " - " as no value (the renderers use "-" for empty fields). */
export function isEmptyValue(value: string | undefined): boolean {
    return !value || value.replace(/[\s-]/g, '') === '';
}

/**
 * Label on the left, value on the right (wrapping, multi-line aware) — the web's mobile field layout. Long
 * press copies the value. With `onOpen` the value is a link (web: reference PR → "View Reference PR").
 */
export function FieldRow({ label, value, onOpen, openLabel }: { label: string; value: string; onOpen?: () => void; openLabel?: string }) {
    const colors = useColors();
    const empty = isEmptyValue(value);
    const link = Boolean(onOpen) && !empty;
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.smd }}>
            <ThemedText variant="footnote" style={{ width: '40%' }}>
                {label}
            </ThemedText>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                <CopyableText
                    variant="subhead"
                    label={label}
                    copyValue={empty ? '' : value}
                    onPress={link ? onOpen : undefined}
                    accessibilityRole={link ? 'link' : undefined}
                    accessibilityLabel={link ? `${openLabel ?? 'Open'} ${value}` : undefined}
                    style={{ flexShrink: 1, textAlign: 'right', color: empty ? colors.tertiaryLabel : link ? colors.accent : colors.label, fontWeight: empty ? '400' : link ? '600' : '500' }}
                >
                    {empty ? '—' : value}
                </CopyableText>
                {link ? <Icon name={{ ios: 'arrow.up.right.square', android: 'open_in_new' }} size={13} color={colors.accent} /> : null}
            </View>
        </View>
    );
}

/**
 * Link of a reference-PR field (PO line "Reference PR"), or undefined for any other field: opens the PR
 * read-only on top of the current screen, like the web "View Reference PR".
 */
export function useReferencePrLink(): (key: string, label: string, value: string) => (() => void) | undefined {
    const router = useRouter();
    return (key, label, value) => {
        if (!isReferencePrField(key, label) || isEmptyValue(value)) return undefined;
        return () => {
            haptics.light();
            router.push({ pathname: '/reference-pr/[number]', params: { number: value.trim() } });
        };
    };
}
