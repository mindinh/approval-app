import { Link } from 'expo-router';
import { memo } from 'react';
import { usePrefetchTaskDetail } from '@/hooks/queries/use-task-queries';
import type { TaskSummary } from '@/utils/task-summary';
import { PressableScale } from './pressable-scale';
import { TaskCard } from './task-card';

const CARD_PRESSED_SCALE = 0.98;

/**
 * A TaskCard that opens the task detail in the current tab's stack. The detail starts loading on
 * press-in; on iOS a long press shows a native preview of the detail (Link.Preview).
 */
export const TaskCardLink = memo(function TaskCardLink({ task, now }: { task: TaskSummary; now: number }) {
    const prefetch = usePrefetchTaskDetail();
    return (
        // asChild: the trigger's Pressable receives the link's onPress (without it Link wraps the card in Text,
        // which shrinks it to its content and swallows the tap).
        <Link href={{ pathname: '/tasks/[id]', params: { id: task.instanceId } }} asChild>
            <Link.Trigger>
                <PressableScale
                    scale={CARD_PRESSED_SCALE}
                    accessibilityRole="button"
                    accessibilityLabel={[task.title, task.typeLabel, task.documentId, task.status.label, task.requester, task.amount?.value].filter(Boolean).join(', ')}
                    accessibilityHint="Opens the task details"
                    onPressIn={() => prefetch(task.instanceId)}
                >
                    <TaskCard task={task} now={now} />
                </PressableScale>
            </Link.Trigger>
            <Link.Preview />
        </Link>
    );
});
