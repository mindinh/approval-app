import { Pressable, TextInput, View } from 'react-native';
import { Icon } from '@/components/icon';
import { radius, shadows, spacing, type, useColors } from '@/theme';

/** Shared with the round filter button beside the field. */
export const SEARCH_FIELD_HEIGHT = 46;

/** Rounded search input with a clear button. */
export function SearchField({ value, onChangeText, placeholder }: { value: string; onChangeText: (text: string) => void; placeholder: string }) {
    const colors = useColors();
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                minHeight: SEARCH_FIELD_HEIGHT,
                paddingHorizontal: spacing.md,
                borderRadius: radius.full,
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                boxShadow: shadows.card,
            }}
        >
            <Icon name={{ ios: 'magnifyingglass', android: 'search' }} size={18} color={colors.tertiaryLabel} />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.tertiaryLabel}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="never"
                accessibilityLabel={placeholder}
                style={[type.callout, { flex: 1, color: colors.label, paddingVertical: 0 }]}
            />
            {value ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => onChangeText('')}>
                    <Icon name={{ ios: 'xmark.circle.fill', android: 'cancel' }} size={18} color={colors.tertiaryLabel} />
                </Pressable>
            ) : null}
        </View>
    );
}
