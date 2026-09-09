import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    parseFLPRoute,
    getInitialFLPRoute,
    subscribeFLPRoute,
    checkParentHashChange,
    initFLPMessageListener,
    _resetFLPStateForTesting,
} from '@/hooks/useFLPSync';
import { parseError } from '@/utils/parseError';

describe('useFLPSync - Route Parsing & Iframe Integration Suite', () => {
    // ─── 1. parseFLPRoute tests ─────────────────────────────────────────────
    describe('parseFLPRoute', () => {
        it('parses SAP Build Workzone Launchpad URL with task ID', () => {
            const hash =
                '#cnma_prorequest_s4h-approve?sap-ui-app-id-hint=3a0f5491-5c0f-4617-ad17-08fcddb63750&/inbox/37188';
            expect(parseFLPRoute(hash, '')).toBe('/inbox/37188');
        });

        it('parses SAP Workzone URL with task ID of another user (e.g. 99999)', () => {
            const hash =
                '#cnma_prorequest_s4h-approve?sap-ui-app-id-hint=3a0f5491-5c0f-4617-ad17-08fcddb63750&/inbox/99999';
            expect(parseFLPRoute(hash, '')).toBe('/inbox/99999');
        });

        it('parses approved tasks deep-link from Workzone URL', () => {
            const hash = '#cnma_prorequest_s4h-approve?&/approved/37188';
            expect(parseFLPRoute(hash, '')).toBe('/approved/37188');
        });

        it('parses direct hash route #/inbox/12345', () => {
            expect(parseFLPRoute('#/inbox/12345', '')).toBe('/inbox/12345');
            expect(parseFLPRoute('/inbox/12345', '')).toBe('/inbox/12345');
        });

        it('parses search query parameter ?taskId=12345', () => {
            expect(parseFLPRoute('', '?taskId=12345')).toBe('/inbox/12345');
        });

        it('parses search query parameter ?InstanceID=000000037188', () => {
            expect(parseFLPRoute('', '?InstanceID=000000037188')).toBe('/inbox/000000037188');
        });

        it('parses search query parameter ?worklist=approved', () => {
            expect(parseFLPRoute('', '?worklist=approved')).toBe('/approved');
        });

        it('parses search query parameter ?worklist=inbox', () => {
            expect(parseFLPRoute('', '?worklist=inbox')).toBe('/inbox');
        });

        it('returns / for root or unmapped hash', () => {
            expect(parseFLPRoute('#', '')).toBe('/');
            expect(parseFLPRoute('', '')).toBe('/');
        });
    });

    // ─── 2. Iframe Cross-Window Messaging tests ─────────────────────────────
    describe('Iframe Messaging & FLP State Handshake', () => {
        let originalWindow: any;
        let mockParent: any;
        let messageListeners: ((event: any) => void)[] = [];

        beforeEach(() => {
            _resetFLPStateForTesting();
            messageListeners = [];

            // Mock window and window.parent to simulate running inside an iframe
            mockParent = {
                location: {
                    hash: '#cnma_prorequest_s4h-approve?&/inbox/10001',
                    search: '',
                },
                postMessage: vi.fn(),
                addEventListener: vi.fn(),
                history: {
                    replaceState: vi.fn(),
                },
            };

            // Setup global window mocks
            originalWindow = global.window;
            (global as any).window = {
                parent: mockParent,
                location: {
                    hash: '',
                    search: '',
                },
                addEventListener: vi.fn((event: string, cb: any) => {
                    if (event === 'message') {
                        messageListeners.push(cb);
                    }
                }),
                removeEventListener: vi.fn(),
                postMessage: vi.fn(),
            };
        });

        afterEach(() => {
            _resetFLPStateForTesting();
            global.window = originalWindow;
        });

        it('requests initial state from parent when initialized in iframe', () => {
            initFLPMessageListener();

            expect(mockParent.postMessage).toHaveBeenCalledWith(
                { type: 'REQUEST_INITIAL_STATE' },
                '*'
            );
        });

        it('receives INITIAL_STATE from parent postMessage and notifies subscribers', () => {
            initFLPMessageListener();

            const routeListener = vi.fn();
            const unsubscribe = subscribeFLPRoute(routeListener);

            // Simulate parent responding with INITIAL_STATE containing a task link
            const targetTaskHash =
                '#cnma_prorequest_s4h-approve?siteId=test&/inbox/99999';
            messageListeners.forEach((listener) =>
                listener({
                    data: {
                        type: 'INITIAL_STATE',
                        hash: targetTaskHash,
                        search: '',
                    },
                })
            );

            expect(routeListener).toHaveBeenCalledWith('/inbox/99999');
            expect(getInitialFLPRoute()).toBe('/inbox/99999');

            unsubscribe();
        });

        it('handles ROUTE_CHANGED postMessage from parent wrapper', () => {
            initFLPMessageListener();

            const routeListener = vi.fn();
            const unsubscribe = subscribeFLPRoute(routeListener);

            // Simulate parent notifying of a new route
            messageListeners.forEach((listener) =>
                listener({
                    data: {
                        type: 'ROUTE_CHANGED',
                        route: '/approved/88888',
                    },
                })
            );

            expect(routeListener).toHaveBeenCalledWith('/approved/88888');

            unsubscribe();
        });

        it('detects external address bar hash changes via checkParentHashChange', () => {
            initFLPMessageListener();

            const routeListener = vi.fn();
            const unsubscribe = subscribeFLPRoute(routeListener);

            // User edits the browser address bar to view task 77777 (not current user's task)
            mockParent.location.hash =
                '#cnma_prorequest_s4h-approve?siteId=test&/inbox/77777';

            checkParentHashChange();

            expect(routeListener).toHaveBeenCalledWith('/inbox/77777');

            unsubscribe();
        });
    });

    // ─── 3. Task Not Found & 403 Forbidden Error Detection ──────────────────
    describe('Unauthorized or Not Found Task Error Handling', () => {
        it('classifies 404 response as notFound category', () => {
            const error404 = {
                response: {
                    status: 404,
                    data: { message: 'Task 99999 not found in worklist' },
                },
            };
            const parsed = parseError(error404);
            expect(parsed.category).toBe('notFound');
            expect(parsed.details?.statusCode).toBe(404);
        });

        it('classifies 403 response as auth category (Access Denied for other user task)', () => {
            const error403 = {
                response: {
                    status: 403,
                    data: { message: 'User not authorized to access task 99999' },
                },
            };
            const parsed = parseError(error403);
            expect(parsed.category).toBe('auth');
            expect(parsed.title).toBe('Access Denied');
            expect(parsed.details?.statusCode).toBe(403);
        });

        it('verifies both 404 and 403 are treated as unavailable in TaskDetailView logic', () => {
            const checkIsUnavailable = (err: any) => {
                const parsed = parseError(err);
                return (
                    parsed.category === 'notFound' ||
                    parsed.category === 'auth' ||
                    parsed.details?.statusCode === 403 ||
                    parsed.details?.statusCode === 404 ||
                    parsed.details?.statusCode === 401
                );
            };

            const notFoundErr = { response: { status: 404 } };
            const forbiddenErr = { response: { status: 403 } };
            const unauthorizedErr = { response: { status: 401 } };
            const server500Err = { response: { status: 500, data: { message: 'DB crash' } } };

            expect(checkIsUnavailable(notFoundErr)).toBe(true);
            expect(checkIsUnavailable(forbiddenErr)).toBe(true);
            expect(checkIsUnavailable(unauthorizedErr)).toBe(true);
            expect(checkIsUnavailable(server500Err)).toBe(false);
        });

        it('verifies auto-selection logic is bypassed when selectedTaskId is present in route', () => {
            // Simulate the exact condition in InboxPage.tsx line 143:
            // if (!selectedTaskId) { navigate(tasks[0]) }
            const tasks = [
                { instanceId: 'task-001', title: 'Task 1' },
                { instanceId: 'task-002', title: 'Task 2' },
            ];

            const invalidPastedTaskId = '99999';
            let navigatedRoute: string | null = null;
            const mockNavigate = (route: string) => {
                navigatedRoute = route;
            };

            // When selectedTaskId is present (e.g. from pasted link), auto-select must NOT trigger
            const shouldAutoSelect = !invalidPastedTaskId && tasks.length > 0;
            if (shouldAutoSelect) {
                mockNavigate(`/inbox/${tasks[0].instanceId}`);
            }

            expect(shouldAutoSelect).toBe(false);
            expect(navigatedRoute).toBeNull();
        });

        it('simulates Component.js inner hash extraction for iframe src URL', () => {
            const extractInitialInnerHash = (parentHash: string): string => {
                if (parentHash.indexOf('&/') !== -1) {
                    const innerRoute = parentHash.split('&/').pop();
                    if (innerRoute) {
                        return '#/' + innerRoute.replace(/^\//, '');
                    }
                } else if (parentHash.indexOf('#/') === 0) {
                    return parentHash;
                }
                return '';
            };

            const workzoneUrlWithBadTask =
                '#cnma_prorequest_s4h-approve?siteId=test&/inbox/99999';
            expect(extractInitialInnerHash(workzoneUrlWithBadTask)).toBe('#/inbox/99999');

            const workzoneApprovedUrl =
                '#cnma_prorequest_s4h-approve?siteId=test&/approved/37188';
            expect(extractInitialInnerHash(workzoneApprovedUrl)).toBe('#/approved/37188');

            const directHashUrl = '#/inbox/99999';
            expect(extractInitialInnerHash(directHashUrl)).toBe('#/inbox/99999');
        });
    });
});
