import { useLocalSearchParams } from 'expo-router';
import { TaskDetailScreen } from '@/screens/task-detail';
import { firstParam } from '@/utils/route-params';

export { CrashScreen as ErrorBoundary } from '@/components/crash-screen';

/** A PO line's reference PR, read-only (web: "View Reference PR"). A PR referencing another PR stacks on top. */
export default function ReferencePrRoute() {
    const { number } = useLocalSearchParams<{ number?: string | string[] }>();
    return <TaskDetailScreen referencePr={firstParam(number)} />;
}
