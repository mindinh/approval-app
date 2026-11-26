import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import { useBffApi } from '@/hooks/use-bff-api';
import { pendingDecisions } from '@/lib/api/pending-decisions';
import { isTaskOpen } from '@/lib/api/write-outcome';
import { readFreshTask } from './read-fresh-task';

/**
 * Re-checks decisions whose outcome was never confirmed (app killed, airplane mode or iOS suspension while
 * sending): at sign-in and every time the app returns to the foreground. Closed task → it went through,
 * the record is dropped and lists refresh. Still open → the user is told it was not sent and can open the
 * task to decide again. Unreadable → kept for the next check. Nothing is ever resent automatically.
 */
export function usePendingDecisionCheck(enabled: boolean) {
    const api = useBffApi();
    const queryClient = useQueryClient();
    const router = useRouter();
    const running = useRef(false);

    useEffect(() => {
        if (!enabled) return;
        const check = async () => {
            if (running.current) return;
            running.current = true;
            try {
                for (const pending of await pendingDecisions.list()) {
                    const open = isTaskOpen(await readFreshTask(queryClient, api, pending.instanceId));
                    if (open === null) continue;
                    await pendingDecisions.forget(pending.instanceId);
                    void queryClient.invalidateQueries({ queryKey: ['tasks'] });
                    if (open) {
                        Alert.alert(`"${pending.decisionText}" was not sent`, `The connection dropped before SAP received your decision for #${pending.documentId}. The request is still waiting for you.`, [
                            { text: 'Later', style: 'cancel' },
                            { text: 'Open request', onPress: () => router.push({ pathname: '/tasks/[id]', params: { id: pending.instanceId } }) },
                        ]);
                    }
                }
            } finally {
                running.current = false;
            }
        };
        void check();
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') void check();
        });
        return () => subscription.remove();
    }, [enabled, api, queryClient, router]);
}
