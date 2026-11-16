import { Stack } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { useDismiss } from '@/hooks/use-dismiss';
import { layout, spacing, useColors } from '@/theme';

/** A link to a screen that does not exist (old or mistyped link): explain and offer the way home. */
export default function NotFoundRoute() {
    const colors = useColors();
    const dismiss = useDismiss();
    return (
        <>
            <Stack.Screen options={{ title: 'Not found', headerShown: false }} />
            <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.groupedBackground }}>
                <View style={{ width: '100%', maxWidth: layout.maxFormWidth, alignSelf: 'center', gap: spacing.lg }}>
                    <EmptyState
                        icon={{ ios: 'link.badge.plus', android: 'link_off' }}
                        tint={{ foreground: colors.secondaryLabel, background: colors.fillBackground }}
                        title="This link does not open anything"
                        message="The page may have moved, or the link is incomplete."
                    />
                    <Button title="Go to Home" onPress={dismiss} style={{ alignSelf: 'stretch' }} />
                </View>
            </View>
        </>
    );
}
