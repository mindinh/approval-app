import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { EmptyState } from '@/components/empty-state';
import { InlineErrorRow } from '@/components/error-state';
import { Section } from '@/components/section';
import { TaskCardSkeleton } from '@/components/task-card';
import { TaskCardLink } from '@/components/task-card-link';
import { ThemedText } from '@/components/themed-text';
import { INBOX_HREF } from '@/constants/tabs';
import { fadeInContent, radius, riseIn, spacing, useColors } from '@/theme';
import type { TaskSummary } from '@/utils/task-summary';

const SKELETON_CARDS = 3;

function SectionHeader({ total, shown }: { total?: number; shown: number }) {
    const router = useRouter();
    const colors = useColors();
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xs }}>
            <View style={{ flex: 1, gap: 2 }}>
                <ThemedText variant="title3" accessibilityRole="header">
                    Latest tasks
                </ThemedText>
                {total !== undefined && total > shown ? (
                    <ThemedText variant="footnote" style={{ fontVariant: ['tabular-nums'] }}>
                        Newest {shown} of {total}
                    </ThemedText>
                ) : null}
            </View>
            <Pressable
                accessibilityRole="link"
                accessibilityHint="Opens the Inbox tab"
                onPress={() => router.navigate(INBOX_HREF)}
                hitSlop={12}
                style={({ pressed }) => ({ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, opacity: pressed ? 0.5 : 1 })}
            >
                <ThemedText variant="subhead" style={{ color: colors.accent, fontWeight: '600' }}>
                    See all
                </ThemedText>
            </Pressable>
        </View>
    );
}

/**
 * The newest open tasks with all four states: loading (skeleton cards), error (retry),
 * empty (only after a successful empty response) and data (stale data stays visible on refetch errors).
 */
export function LatestTasksSection({
    tasks,
    now,
    total,
    isLoading,
    error,
    onRetry,
}: {
    tasks?: readonly TaskSummary[];
    /** When the list was fetched (reference for the task age). */
    now: number;
    total?: number;
    isLoading: boolean;
    error: Error | null;
    onRetry: () => void;
}) {
    const colors = useColors();
    const reduceMotion = useReducedMotion();

    return (
        <View style={{ gap: spacing.smd }}>
            <SectionHeader total={total} shown={tasks?.length ?? 0} />

            {isLoading && !tasks ? Array.from({ length: SKELETON_CARDS }, (_, index) => <TaskCardSkeleton key={index} />) : null}

            {tasks && tasks.length === 0 ? (
                <Animated.View entering={fadeInContent}>
                    <EmptyState
                        icon={{ ios: 'checkmark.seal.fill', android: 'verified' }}
                        tint={{ foreground: colors.secondaryLabel, background: colors.fillBackground }}
                        title="No pending tasks"
                        message="New approval requests from SAP will show up here."
                    />
                </Animated.View>
            ) : null}

            {/* Cards rise in when they first mount (first load, or a new task arriving); refetches keep them still. */}
            {tasks?.map((task, index) => (
                <Animated.View key={`${task.key}-${index}`} entering={riseIn(index, reduceMotion)}>
                    <TaskCardLink task={task} now={now} />
                </Animated.View>
            ))}

            {error ? (
                <Section>
                    <InlineErrorRow title={tasks ? 'Could not refresh tasks' : 'Could not load tasks'} error={error} onRetry={onRetry} />
                </Section>
            ) : null}
        </View>
    );
}
