import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskprocessingAdapter } from '../../../srv/lib/integrations/taskprocessing-adapter';

vi.mock('../../../srv/lib/integrations/sap-client', () => {
    return {
        SapClient: class {
            get = vi.fn();
            post = vi.fn();
            fetchCsrf = vi.fn().mockResolvedValue({ token: 'mock-csrf-token', cookie: 'mock-cookie' });
        }
    };
});

describe('TaskprocessingAdapter', () => {
    let adapter: TaskprocessingAdapter;
    let mockSapClient: any;

    beforeEach(() => {
        vi.clearAllMocks();
        adapter = new TaskprocessingAdapter();
        mockSapClient = (adapter as any).sapClient;
    });

    describe('searchUsers', () => {
        it('should pass un-encoded search pattern with single quotes escaped to sapClient.get params', async () => {
            mockSapClient.get.mockResolvedValue({
                d: {
                    results: [
                        { UniqueName: 'CONARUM3', DisplayName: 'User Conarum 3', Email: 'minh.dinh@conarum.com' }
                    ]
                }
            });

            const users = await adapter.searchUsers('minh.dinh@conarum.com', 'MOCK_USER');

            expect(users).toHaveLength(1);
            expect(users[0].UniqueName).toBe('CONARUM3');
            expect(mockSapClient.get).toHaveBeenCalledWith(
                '/sap/opu/odata/IWPGW/TASKPROCESSING;v=2',
                '/SearchUsers',
                {
                    $format: 'json',
                    SearchPattern: "'minh.dinh@conarum.com'",
                    MaxResults: 100
                },
                'MOCK_USER',
                undefined
            );
        });

        it('should escape single quotes inside SearchPattern', async () => {
            mockSapClient.get.mockResolvedValue({ d: { results: [] } });

            await adapter.searchUsers("o'connor@conarum.com", 'MOCK_USER');

            expect(mockSapClient.get).toHaveBeenCalledWith(
                '/sap/opu/odata/IWPGW/TASKPROCESSING;v=2',
                '/SearchUsers',
                {
                    $format: 'json',
                    SearchPattern: "'o''connor@conarum.com'",
                    MaxResults: 100
                },
                'MOCK_USER',
                undefined
            );
        });
    });
});
