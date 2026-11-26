import { useRouter } from 'expo-router';
import { userNameOf } from '@/lib/auth/jwt';
import { useSession } from '@/lib/auth/session';
import { haptics } from '@/lib/haptics';
import { radius, shadows, useColors } from '@/theme';
import { Avatar } from './avatar';
import { PressableScale } from './pressable-scale';

const SIZE = 44;
const RING = 2;

/** The user's avatar (white ring, soft shadow) that opens the profile sheet. */
export function AccountButton() {
    const router = useRouter();
    const colors = useColors();
    const { user } = useSession();
    const name = user?.claims?.name || userNameOf(user?.claims ?? null) || '?';

    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Profile"
            hitSlop={8}
            onPress={() => {
                haptics.light();
                router.push('/account');
            }}
            style={{ padding: RING, borderRadius: radius.full, backgroundColor: colors.cardBackground, boxShadow: shadows.card }}
        >
            <Avatar name={name} size={SIZE - RING * 2} />
        </PressableScale>
    );
}
