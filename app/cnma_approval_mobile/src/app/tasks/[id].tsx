import { useLocalSearchParams } from 'expo-router';
import { TaskDetailScreen } from '@/screens/task-detail';
import { firstParam } from '@/utils/route-params';

/** A crash while rendering a task shows the friendly error panel instead of a blank screen. */
export { CrashScreen as ErrorBoundary } from '@/components/crash-screen';

export default function TaskDetailRoute() {
    const { id } = useLocalSearchParams<{ id?: string | string[] }>();
    return <TaskDetailScreen instanceId={firstParam(id)} />;
}
