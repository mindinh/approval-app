import { describe, expect, it, vi } from 'vitest';
import { inboxApi } from '@/services/inbox/inbox.api';
import axiosInstance from '@/services/core/axiosInstance';

vi.mock('@/services/core/axiosInstance', () => ({ default: { get: vi.fn().mockResolvedValue({ data: {} }) } }));

describe('inbox HTTP cancellation', () => {
    it('forwards the request signal for both lists, detail, and counts', async () => {
        const { signal } = new AbortController();
        await inboxApi.getTasks({ category: 'PR' }, signal);
        await inboxApi.getApprovedTasks({ category: 'PO' }, signal);
        await inboxApi.getTaskDetail('123', signal);
        await inboxApi.getCategoryCounts('my', signal);
        await inboxApi.getStatusCounts(signal);
        expect(axiosInstance.get).toHaveBeenCalledTimes(5);
        for (const [, config] of vi.mocked(axiosInstance.get).mock.calls) expect(config?.signal).toBe(signal);
    });
});
