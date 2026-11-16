import { Pressable, View } from 'react-native';
import { Icon } from '@/components/icon';
import { Pill } from '@/components/pill';
import { ThemedText } from '@/components/themed-text';
import { useDismiss } from '@/hooks/use-dismiss';
import { haptics } from '@/lib/haptics';
import { radius, shadows, spacing, useColors } from '@/theme';
import type { TaskDetailView } from '@/utils/task-detail';

const BACK_SIZE = 40;

/**
 * Compact top bar of the detail, drawn in place of a native header so the row next to the back button
 * carries information instead of empty space: back · document type + number · CC / status.
 */
export function DetailTopBar({ view }: { view: TaskDetailView | null }) {
    const colors = useColors();
    const dismiss = useDismiss();
    const goBack = () => {
        haptics.light();
        dismiss();
    };

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.smd, minHeight: BACK_SIZE + spacing.sm }}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                hitSlop={8}
                onPress={goBack}
                style={({ pressed }) => ({
                    width: BACK_SIZE,
                    height: BACK_SIZE,
                    borderRadius: radius.full,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.cardBackground,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    boxShadow: shadows.card,
                    opacity: pressed ? 0.7 : 1,
                })}
            >
                <Icon name={{ ios: 'chevron.left', android: 'arrow_back' }} size={17} color={colors.label} />
            </Pressable>
            {view ? (
                <>
                    <View style={{ flex: 1, gap: 1 }}>
                        <ThemedText variant="caption" numberOfLines={1} style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {view.typeLabel}
                        </ThemedText>
                        <ThemedText variant="subhead" numberOfLines={1} selectable style={{ color: colors.label, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                            #{view.documentId}
                        </ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 }}>
                        {view.isCc ? <Pill label="CC" tone="warning" /> : null}
                        <Pill label={view.status.label} tone={view.status.tone} />
                    </View>
                </>
            ) : (
                <View style={{ flex: 1 }} />
            )}
        </View>
    );
}

/**
 * Detail title. Type, number, CC and status sit in the top bar; document type, requester and dates live
 * in the Overview tab (as on the web), so the screen spends its height on content.
 */
export function DetailHeader({ view }: { view: TaskDetailView }) {
    return (
        <View style={{ paddingHorizontal: spacing.xs }}>
            <ThemedText variant="title" selectable accessibilityRole="header">
                {view.title}
            </ThemedText>
        </View>
    );
}
