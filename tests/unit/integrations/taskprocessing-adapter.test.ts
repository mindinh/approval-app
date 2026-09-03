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

    describe('executeDecision', () => {
        it('should call sapClient.post with formatted Decision URL and payload', async () => {
            mockSapClient.post.mockResolvedValue({ d: { Decision: 'Success' } });

            const res = await adapter.executeDecision('12345', '0001', 'Approved', 'MOCK_USER', 'mock-jwt');

            expect(res).toEqual({ d: { Decision: 'Success' } });
            expect(mockSapClient.post).toHaveBeenCalledWith(
                '/sap/opu/odata/IWPGW/TASKPROCESSING;v=2',
                "/Decision?InstanceID='000000012345'&DecisionKey='0001'",
                { Comments: 'Approved' },
                {},
                'MOCK_USER',
                'mock-jwt'
            );
        });
    });

    describe('forwardTask', () => {
        it('should call sapClient.post with formatted Forward URL', async () => {
            mockSapClient.post.mockResolvedValue({ d: { Forward: 'Success' } });

            const res = await adapter.forwardTask('12345', 'USER2', 'Please check', 'MOCK_USER');

            expect(res).toEqual({ d: { Forward: 'Success' } });
            expect(mockSapClient.post).toHaveBeenCalledWith(
                '/sap/opu/odata/IWPGW/TASKPROCESSING;v=2',
                "/Forward?InstanceID='000000012345'&ForwardTo='USER2'&Comments='Please%20check'",
                {},
                {},
                'MOCK_USER',
                undefined
            );
        });
    });
});
