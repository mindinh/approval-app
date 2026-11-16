import * as SecureStore from 'expo-secure-store';

/**
 * Decisions whose outcome is not known yet, kept on the device until checked against SAP. A decision is
 * recorded right before it is sent and removed once the outcome is clear. If the app is killed, the phone
 * goes offline or iOS suspends the app mid-request, the record survives and the app re-checks the task
 * the next time it is in the foreground (see usePendingDecisionCheck). Nothing is ever resent automatically.
 */
export interface PendingDecision {
    instanceId: string;
    decisionKey: string;
    decisionText: string;
    documentId: string;
    /** Epoch ms when it was sent. */
    sentAt: number;
}

const KEY = 'pending-decisions';
const options: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };
/** Older records are dropped: SAP has long settled them and the task list shows the real state. */
export const PENDING_MAX_AGE_MS = 24 * 60 * 60_000;
const MAX_RECORDS = 20;

function parse(raw: string | null): PendingDecision[] {
    if (!raw) return [];
    try {
        const value: unknown = JSON.parse(raw);
        return Array.isArray(value) ? (value.filter((item) => item && typeof item.instanceId === 'string' && typeof item.sentAt === 'number') as PendingDecision[]) : [];
    } catch {
        return [];
    }
}

/** Records that are still worth checking (pure: unit-tested). */
export function freshPending(records: readonly PendingDecision[], now: number): PendingDecision[] {
    return records.filter((record) => now - record.sentAt <= PENDING_MAX_AGE_MS);
}

async function read(): Promise<PendingDecision[]> {
    try {
        return parse(await SecureStore.getItemAsync(KEY, options));
    } catch {
        return [];
    }
}

async function write(records: PendingDecision[]): Promise<void> {
    try {
        if (records.length === 0) await SecureStore.deleteItemAsync(KEY, options);
        else await SecureStore.setItemAsync(KEY, JSON.stringify(records.slice(-MAX_RECORDS)), options);
    } catch {
        // Best effort: losing a record only skips the later re-check, never sends anything.
    }
}

export const pendingDecisions = {
    list: async () => freshPending(await read(), Date.now()),
    remember: async (record: PendingDecision) => write([...(await read()).filter((item) => item.instanceId !== record.instanceId), record]),
    forget: async (instanceId: string) => write((await read()).filter((item) => item.instanceId !== instanceId)),
    clear: () => write([]),
};
