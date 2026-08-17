import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InboxProcessor } from '../../srv/lib/processors/inbox-processor';
import { runLoadTest, printMetrics } from './load-generator';

// Mock adapters for high performance stress test execution
vi.mock('../../srv/lib/integrations/taskprocessing-adapter', () => {
    return {
        TaskprocessingAdapter: class {
            getTasks = vi.fn().mockResolvedValue([
                {
                    InstanceID: 'task-pr-01',
                    TaskTitle: 'Approve PR 10001234',
                    CreatedOn: '2026-07-23T08:00:00Z',
                    Status: 'READY',
                    Priority: 'HIGH',
                    SupportsComments: true,
                },
            ]);
            getTaskRuntime = vi.fn().mockResolvedValue({
                InstanceID: 'task-pr-01',
                TaskTitle: 'Approve PR 10001234',
                TaskDefinitionID: 'PR_APPROVE',
                CreatedOn: '2026-07-23T08:00:00Z',
                Status: 'READY',
                Priority: 'HIGH',
                SupportsComments: true,
            });
            executeDecision = vi.fn().mockResolvedValue(true);
        },
    };
});

vi.mock('../../srv/lib/integrations/sap-odata-adapter', () => {
    return {
        SapOdataAdapter: class {
            getInstances = vi.fn().mockResolvedValue([
                {
                    WorkflowTaskInstance: 'task-pr-01',
                    PurchaseRequisition: '10001234',
                    SAPOrigin: 'LOCAL',
                    BusinessObjectType: 'PR',
                    WorkflowTaskStatus: 'IN PROCESSING',
                    CreatedDateTime: '2026-07-23T08:00:00Z',
                },
            ]);
            getDetailBatch = vi.fn().mockResolvedValue({
                'task-pr-01': {
                    header: {
                        purchaseRequisition: '10001234',
                        purchaseRequisitionType: 'NB',
                        createdByUser: 'USER_01',
                        purReqDescription: 'Laptops for Dev Team',
                        purchaseRequisitionPrice: '5000.00',
                        purReqFinalSignOffStatus: 'IN_PROCESS',
                    },
                    items: [
                        {
                            purchaseRequisitionItem: '00010',
                            material: 'MAT-01',
                            purchaseRequisitionItemText: 'MacBook Pro 16"',
                            requestedQuantity: '5',
                            baseUnit: 'EA',
                            itemNetAmount: '5000.00',
                        },
                    ],
                    comments: [
                        {
                            author: 'User 1',
                            authorName: 'User 1',
                            text: 'Please review',
                            status: 'APPR',
                            postedOn: '2026-07-23',
                            postedTime: '08:00:00',
                        },
                    ],
                    attachments: [
                        {
                            id: 'att-01',
                            fileName: 'Quotation.pdf',
                            mimeType: 'application/pdf',
                            fileSize: 1048576,
                            createdBy: 'Admin',
                            createdAt: '2026-07-23T08:00:00Z',
                        },
                    ],
                },
            });
            getDetail = vi.fn().mockResolvedValue({
                header: {
                    purchaseRequisition: '10001234',
                    purchaseRequisitionType: 'NB',
                    createdByUser: 'USER_01',
                },
                items: [],
                comments: [],
                attachments: [
                    {
                        id: 'att-01',
                        fileName: 'Quotation.pdf',
                        mimeType: 'application/pdf',
                        fileSize: 1048576,
                        createdBy: 'Admin',
                        createdAt: '2026-07-23T08:00:00Z',
                    },
                ],
            });
            addComment = vi.fn().mockResolvedValue(true);
            fetchAttachmentContent = vi.fn().mockResolvedValue({
                data: Buffer.from('mock content buffer'),
                mimeType: 'application/pdf',
                fileName: 'Quotation.pdf',
            });
        },
    };
});

describe('API Stress & Performance Benchmark Suite', () => {
    let processor: InboxProcessor;

    beforeEach(() => {
        processor = new InboxProcessor();
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. GET /tasks (Task List Fetching)
    // ─────────────────────────────────────────────────────────────────────────────
    describe('1. GET /tasks (Task List Performance)', () => {
        it('Scenario 1.1: Single Request Baseline Latency', async () => {
            const start = performance.now();
            const result = await processor.getTasks('TEST_USER');
            const duration = performance.now() - start;

            expect(result.items.length).toBeGreaterThan(0);
            expect(duration).toBeLessThan(50); // Must complete under 50ms baseline
        });

        it('Scenario 1.2: High Concurrency Burst (50 concurrent users, 200 requests)', async () => {
            const metrics = await runLoadTest(
                async () => {
                    const res = await processor.getTasks('TEST_USER');
                    expect(res.items).toBeDefined();
                },
                { concurrency: 50, totalRequests: 200 }
            );

            printMetrics('GET /tasks - High Concurrency Burst', metrics);

            expect(metrics.failedRequests).toBe(0);
            expect(metrics.latency.p95Ms).toBeLessThan(100);
            expect(metrics.rps).toBeGreaterThan(200);
        });

        it('Scenario 1.3: Pagination Stress (skip & top offsets under load)', async () => {
            const metrics = await runLoadTest(
                async (i) => {
                    const skip = (i % 10) * 10;
                    const top = 10;
                    const res = await processor.getTasks('TEST_USER', skip, top);
                    expect(res.items).toBeDefined();
                },
                { concurrency: 20, totalRequests: 100 }
            );

            printMetrics('GET /tasks - Pagination Stress', metrics);

            expect(metrics.failedRequests).toBe(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. GET /tasks/approved (Approved Tasks Worklist)
    // ─────────────────────────────────────────────────────────────────────────────
    describe('2. GET /tasks/approved (Completed Tasks Performance)', () => {
        it('Scenario 2.1: Concurrent Completed Tasks Queries (30 Virtual Users, 150 requests)', async () => {
            const metrics = await runLoadTest(
                async () => {
                    const res = await processor.getApprovedTasks('TEST_USER');
                    expect(res.items).toBeDefined();
                },
                { concurrency: 30, totalRequests: 150 }
            );

            printMetrics('GET /tasks/approved - Concurrent Queries', metrics);

            expect(metrics.failedRequests).toBe(0);
            expect(metrics.latency.p95Ms).toBeLessThan(100);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. GET /tasks/:id (Task Detail Retrieval)
    // ─────────────────────────────────────────────────────────────────────────────
    describe('3. GET /tasks/:id (Task Detail Performance)', () => {
        it('Scenario 3.1: Parallel Task Detail Fetch with Performance Hints (50 Virtual Users, 200 requests)', async () => {
            const metrics = await runLoadTest(
                async () => {
                    const detail = await processor.getTaskDetail('task-pr-01', 'TEST_USER', {
                        documentId: '10001234',
                        sapOrigin: 'LOCAL',
                        businessObjectType: 'PR',
                    });
                    expect(detail.taskprocessing.task?.InstanceID).toBe('task-pr-01');
                },
                { concurrency: 50, totalRequests: 200 }
            );

            printMetrics('GET /tasks/:id - Parallel Detail with Hints', metrics);

            expect(metrics.failedRequests).toBe(0);
            expect(metrics.latency.p95Ms).toBeLessThan(50);
        });

        it('Scenario 3.2: Task Detail Sequential Fallback (hints missing)', async () => {
            const metrics = await runLoadTest(
                async () => {
                    const detail = await processor.getTaskDetail('task-pr-01', 'TEST_USER');
                    expect(detail.taskprocessing.task?.InstanceID).toBe('task-pr-01');
                },
                { concurrency: 20, totalRequests: 100 }
            );

            printMetrics('GET /tasks/:id - Sequential Fallback', metrics);

            expect(metrics.failedRequests).toBe(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // 4. GET /pr/:docNum/attachments & File Streaming
    // ─────────────────────────────────────────────────────────────────────────────
    describe('4. Attachments & Binary Streaming Performance', () => {
        it('Scenario 4.1: Rapid Attachment Metadata Requests (100 parallel requests)', async () => {
            const metrics = await runLoadTest(
                async () => {
                    const atts = await processor.getPrAttachments('10001234', 'TEST_USER');
                    expect(atts.length).toBeGreaterThan(0);
                },
                { concurrency: 30, totalRequests: 100 }
            );

            printMetrics('GET /pr/:docNum/attachments - Metadata Fetch', metrics);

            expect(metrics.failedRequests).toBe(0);
        });

        it('Scenario 4.2: Concurrent Attachment Content Streaming (50 parallel file streams)', async () => {
            const metrics = await runLoadTest(
                async () => {
                    const content = await processor.getAttachmentContent(
                        'task-pr-01',
                        'att-01',
                        '10001234',
                        'LOCAL',
                        'TEST_USER'
                    );
                    expect(content.data).toBeDefined();
                },
                { concurrency: 50, totalRequests: 150 }
            );

            printMetrics('GET /attachments/:attId/content - Binary Streaming', metrics);

            expect(metrics.failedRequests).toBe(0);
            expect(metrics.latency.p95Ms).toBeLessThan(50);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // 5. POST /tasks/:id/comments (Task Comments Submission)
    // ─────────────────────────────────────────────────────────────────────────────
    describe('5. POST /tasks/:id/comments (Task Commenting Stress Test)', () => {
        it('Scenario 5.1: High Concurrency Comment Posting (20 Virtual Users, 100 comments)', async () => {
            const metrics = await runLoadTest(
                async (i) => {
                    await processor.addComment(
                        '10001234',
                        `Automated stress test comment #${i}`,
                        'TEST_USER'
                    );
                },
                { concurrency: 20, totalRequests: 100 }
            );

            printMetrics('POST /tasks/:id/comments - High Concurrency Posting', metrics);

            expect(metrics.failedRequests).toBe(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // 6. POST /tasks/:id/decision (Approval & Rejection Execution)
    // ─────────────────────────────────────────────────────────────────────────────
    describe('6. POST /tasks/:id/decision (Decision Execution Stress Test)', () => {
        it('Scenario 6.1: High Volume Decision Postings (50 Virtual Users, 250 decisions)', async () => {
            const metrics = await runLoadTest(
                async (i) => {
                    const decisionId = i % 2 === 0 ? '0001' : '0002'; // Alternate Approve & Reject
                    const result = await processor.executeDecision(
                        'task-pr-01',
                        decisionId,
                        decisionId,
                        `Decision execution #${i}`,
                        'TEST_USER',
                        undefined,
                        { documentId: '10001234', businessObjectType: 'PR' }
                    );
                    expect(result).toBe(true);
                },
                { concurrency: 50, totalRequests: 250 }
            );

            printMetrics('POST /tasks/:id/decision - High Volume Execution', metrics);

            expect(metrics.failedRequests).toBe(0);
            expect(metrics.rps).toBeGreaterThan(300);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // 7. Full End-to-End User Session Simulation
    // ─────────────────────────────────────────────────────────────────────────────
    describe('7. End-to-End User Flow Simulation under Heavy Load', () => {
        it('Scenario 7.1: Simulated User Workflows (50 Virtual Users doing full lifecycle operations)', async () => {
            const metrics = await runLoadTest(
                async (i) => {
                    // Step 1: List inbox tasks
                    const tasks = await processor.getTasks('TEST_USER');
                    expect(tasks.items).toBeDefined();

                    // Step 2: View task detail
                    const detail = await processor.getTaskDetail('task-pr-01', 'TEST_USER', {
                        documentId: '10001234',
                        sapOrigin: 'LOCAL',
                        businessObjectType: 'PR',
                    });
                    expect(detail.taskprocessing.task?.InstanceID).toBe('task-pr-01');

                    // Step 3: Stream attachment content
                    const content = await processor.getAttachmentContent(
                        '10001234',
                        'att-01',
                        'TEST_USER'
                    );
                    expect(content.data).toBeDefined();

                    // Step 4: Add user comment
                    await processor.addComment(
                        '10001234',
                        `E2E flow comment step #${i}`,
                        'TEST_USER'
                    );

                    // Step 5: Execute approval decision
                    const decRes = await processor.executeDecision(
                        'task-pr-01',
                        '0001',
                        '0001',
                        'Approved in E2E flow',
                        'TEST_USER',
                        undefined,
                        { documentId: '10001234', businessObjectType: 'PR' }
                    );
                    expect(decRes).toBe(true);
                },
                { concurrency: 20, totalRequests: 100 }
            );

            printMetrics('Full End-to-End Lifecycle Workflow Simulation', metrics);

            expect(metrics.failedRequests).toBe(0);
        });
    });
});
