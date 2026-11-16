import { Pressable, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { spacing, useColors } from '@/theme';
import type { MentionUser } from '@/utils/mentions';

/** Comfortable touch height for a person row (above the 44pt minimum). */
export const PERSON_ROW_HEIGHT = 56;

/** One person: avatar, name, SAP user and e-mail; a check when already tagged. Used by the @ suggestions and the Tag people sheet. */
export function PersonRow({ user, selected, divider, onPress }: { user: MentionUser; selected: boolean; divider: boolean; onPress: () => void }) {
    const colors = useColors();
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${user.fullName}, ${user.sapUser}`}
            accessibilityHint={selected ? 'Tagged' : 'Tag this person'}
            style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.smd,
                minHeight: PERSON_ROW_HEIGHT,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: pressed ? colors.fillBackground : 'transparent',
                borderTopWidth: divider ? 0.5 : 0,
                borderTopColor: colors.separator,
            })}
        >
            <Avatar name={user.fullName} size={34} tone="neutral" />
            <View style={{ flex: 1, gap: 1 }}>
                <ThemedText variant="callout" numberOfLines={1} style={{ fontWeight: '600' }}>
                    {user.fullName}
                </ThemedText>
                <ThemedText variant="caption" numberOfLines={1} style={{ color: colors.secondaryLabel }}>
                    {user.email ? `${user.sapUser} · ${user.email}` : user.sapUser}
                </ThemedText>
            </View>
            {selected ? <Icon name={{ ios: 'checkmark.circle.fill', android: 'check_circle' }} size={22} color={colors.accent} /> : <Icon name={{ ios: 'circle', android: 'radio_button_unchecked' }} size={22} color={colors.tertiaryLabel} />}
        </Pressable>
    );
}
