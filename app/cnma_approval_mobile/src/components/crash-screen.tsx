import type { ErrorBoundaryProps } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, useColors } from '@/theme';
import { ErrorState } from './error-state';

/**
 * Route error boundary (Expo Router `ErrorBoundary` export): if a screen crashes while rendering, the user
 * gets the friendly error panel with "Try again" and "Send details to IT" instead of a blank or red screen.
 */
export function CrashScreen({ error, retry }: ErrorBoundaryProps) {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.md, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: colors.groupedBackground }}>
            <ErrorState error={error} context="Showing a screen" onRetry={retry} />
        </View>
    );
}
