import { View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { CopyableText } from '@/components/copyable-text';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { radius, spacing, useColors } from '@/theme';

const AVATAR_SIZE = 88;

/** Identity block (first row of the profile list): large avatar, name, email and sign-in provider. */
export function ProfileHeader({ name, email }: { name: string; email?: string }) {
    const colors = useColors();
    return (
        <View
            style={{
                alignItems: 'center',
                gap: spacing.smd,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
            }}
        >
            <Avatar name={name} size={AVATAR_SIZE} />
            <View style={{ alignItems: 'center', gap: 2 }}>
                <ThemedText variant="title" numberOfLines={1}>
                    {name}
                </ThemedText>
                {email ? (
                    <CopyableText variant="subhead" numberOfLines={1} label="e-mail">
                        {email}
                    </CopyableText>
                ) : null}
            </View>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                    paddingHorizontal: spacing.smd,
                    paddingVertical: spacing.xs,
                    borderRadius: radius.full,
                    backgroundColor: colors.fillBackground,
                }}
            >
                <Icon name={{ ios: 'checkmark.shield.fill', android: 'verified_user' }} size={14} color={colors.accent} />
                <ThemedText variant="caption">Signed in with Microsoft</ThemedText>
            </View>
        </View>
    );
}
