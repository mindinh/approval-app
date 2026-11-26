import { ListErrorState } from '@/pages/Inbox/components/TaskListStates';

interface HomeErrorStateProps {
    error: unknown;
    onRetry: () => void;
    isRefreshing: boolean;
}

/** Error card shown in place of the newest tasks feed when nothing could be loaded. */
export function HomeErrorState({ error, onRetry, isRefreshing }: HomeErrorStateProps) {
    return (
        <div className="rounded-xl border bg-card border-border shadow-md">
            <ListErrorState
                error={error}
                onRefresh={onRetry}
                isRefreshing={isRefreshing}
            />
        </div>
    );
}
