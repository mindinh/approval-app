import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the inbox-processor so we can drive the controller in isolation.
const mockExecuteDecision = vi.fn();
const mockForwardTask = vi.fn();
const mockAddComment = vi.fn();
const mockGetStatusCounts = vi.fn();
const mockGetCurrentSapUser = vi.fn();

vi.mock('../../../srv/lib/processors/inbox-processor', () => {
    return {
        InboxProcessor: class {
            executeDecision = mockExecuteDecision;
            forwardTask = mockForwardTask;
            addComment = mockAddComment;
            getStatusCounts = mockGetStatusCounts;
            getCurrentSapUser = mockGetCurrentSapUser;
        }
    };
});

import { InboxController } from '../../../srv/controllers/inbox-controller';

describe('InboxController.getCurrentSapUser', () => {
    it('passes the authenticated principal to SAP and returns the resolved username', async () => {
        const { req, res, next } = makeReqRes({});
        delete req.headers['x-sap-user'];
        const token = `header.${Buffer.from(JSON.stringify({ email: 'hieu.lam@example.com' })).toString('base64url')}.signature`;
        req.headers.authorization = `Bearer ${token}`;
        mockGetCurrentSapUser.mockResolvedValueOnce({ sapUsername: 'CONARUM2' });
        await new InboxController().getCurrentSapUser(req, res, next);
        expect(mockGetCurrentSapUser).toHaveBeenCalledWith('HIEU.LAM@EXAMPLE.COM', token);
        expect(res.json).toHaveBeenCalledWith({ sapUsername: 'CONARUM2' });
        expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store');
    });

    it('propagates lookup errors instead of claiming the email is a SAP username', async () => {
        const { req, res, next } = makeReqRes({});
        const error = new Error('SAP current-user endpoint unavailable');
        mockGetCurrentSapUser.mockRejectedValueOnce(error);
        await new InboxController().getCurrentSapUser(req, res, next);
        expect(next).toHaveBeenCalledWith(error);
        expect(res.json).not.toHaveBeenCalled();
    });
});

describe('InboxController.getMe comment writer identity', () => {
    afterEach(() => vi.unstubAllEnvs());

    function getProfile() {
        const { req, res } = makeReqRes({});
        delete req.headers.authorization;
        new InboxController().getMe(req, res);
        return res.json.mock.calls[0][0];
    }

    beforeEach(() => {
        vi.stubEnv('NODE_ENV', 'development');
        vi.stubEnv('VCAP_APPLICATION', '');
        vi.stubEnv('SAP_USE_DESTINATION', 'false');
        vi.stubEnv('SAP_SEND_USER_HEADER', 'false');
        vi.stubEnv('SAP_TASK_USER', ' LocalWriter ');
    });

    it('preserves login identity and exposes the explicit local Basic Auth writer', () => {
        expect(getProfile()).toMatchObject({ id: 'MOCK_USER', sapUser: 'MOCK_USER', commentAuthorId: 'LOCALWRITER' });
    });

    it.each([
        ['NODE_ENV', 'production'], ['VCAP_APPLICATION', '{}'],
        ['SAP_USE_DESTINATION', 'true'], ['SAP_SEND_USER_HEADER', 'true'], ['SAP_TASK_USER', ''],
    ])('does not infer a writer when %s=%s', (key, value) => {
        vi.stubEnv(key, value);
        expect(getProfile()).not.toHaveProperty('commentAuthorId');
    });
});

// Bypass auth-helper by stubbing resolveIdentity. We achieve this with a
// minimal middleware that injects sapUser/userJwt before the controller runs.
function makeReqRes(body: any, params: any = {}, query: any = {}) {
    const req: any = {
        body,
        params,
        query,
        headers: { 'x-sap-user': 'MOCK_USER', authorization: 'Bearer mock-jwt' },
    };
    const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
        setHeader: vi.fn().mockReturnThis(),
    };
    const next = vi.fn();
    return { req, res, next };
}

describe('InboxController.getStatusCounts', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns all Home counts from the aggregate processor', async () => {
        const counts = { total: 8, inApproval: 3, completed: 5 };
        mockGetStatusCounts.mockResolvedValue(counts);
        const { req, res, next } = makeReqRes({});
        await new InboxController().getStatusCounts(req, res, next);
        expect(mockGetStatusCounts).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith(counts);
        expect(next).not.toHaveBeenCalled();
    });

    it('passes aggregate failures to error middleware', async () => {
        const error = new Error('SAP unavailable');
        mockGetStatusCounts.mockRejectedValue(error);
        const { req, res, next } = makeReqRes({});
        await new InboxController().getStatusCounts(req, res, next);
        expect(next).toHaveBeenCalledWith(error);
        expect(res.json).not.toHaveBeenCalled();
    });
});

describe('InboxController.postDecision', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects body without decisionKey with AppError(400)', async () => {
        const { req, res, next } = makeReqRes({}, { id: 'task-1' });
        const controller = new InboxController();
        await controller.postDecision(req, res, next);

        // next receives the error; controller does NOT call res.json
        expect(next).toHaveBeenCalledTimes(1);
        const err = next.mock.calls[0][0];
        expect(err.statusCode).toBe(400);
        expect(res.json).not.toHaveBeenCalled();
    });

    it('rejects non-string decisionKey with AppError(400)', async () => {
        const { req, res, next } = makeReqRes({ decisionKey: 12345 }, { id: 'task-1' });
        await new InboxController().postDecision(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        const err = next.mock.calls[0][0];
        expect(err.statusCode).toBe(400);
    });

    it('returns AppError(400) when Claim has no documentId in _context', async () => {
        mockExecuteDecision.mockRejectedValue(Object.assign(new Error('Missing documentId for Claim decision'), { statusCode: 400 }));
        const { req, res, next } = makeReqRes({
            decisionKey: '0001',
            sapDecisionKey: '0001',
            comment: 'approve claim 212',
            _context: { businessObjectType: 'CLAIM' },
        }, { id: '212' });
        await new InboxController().postDecision(req, res, next);

        // The controller passes errors to next(). After our refactor, the
        // controller MUST propagate the 400 instead of swallowing it.
        expect(next).toHaveBeenCalledTimes(1);
        const err = next.mock.calls[0][0];
        expect(err.statusCode).toBe(400);
        expect(String(err.message)).toContain('documentId');
    });

    it('forwards successful result to res.json', async () => {
        mockExecuteDecision.mockResolvedValue({ status: 'SUCCESS', message: 'Claim approved.' });
        const { req, res, next } = makeReqRes({
            decisionKey: '0001',
            sapDecisionKey: '0001',
            comment: 'ok',
            _context: { documentId: '212', businessObjectType: 'CLAIM' },
        }, { id: '212' });
        await new InboxController().postDecision(req, res, next);

        expect(mockExecuteDecision).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(next).not.toHaveBeenCalled();
    });
});

describe('InboxController.postForwardTask', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects missing forwardTo with AppError(400)', async () => {
        const { req, res, next } = makeReqRes({}, { id: 'task-1' });
        await new InboxController().postForwardTask(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it('rejects non-string forwardTo with AppError(400)', async () => {
        const { req, res, next } = makeReqRes({ forwardTo: 123 }, { id: 'task-1' });
        await new InboxController().postForwardTask(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it('forwards successful result', async () => {
        mockForwardTask.mockResolvedValue({ success: true });
        const { req, res, next } = makeReqRes({
            forwardTo: 'CONARUM3',
            comment: 'please review',
            _context: { documentId: '10001234', businessObjectType: 'PR' },
        }, { id: 'task-1' });
        await new InboxController().postForwardTask(req, res, next);
        expect(mockForwardTask).toHaveBeenCalledWith('task-1', 'CONARUM3', 'please review', 'MOCK_USER', 'mock-jwt', expect.any(Object));
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(next).not.toHaveBeenCalled();
    });
});

describe('InboxController.postComment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects empty text with AppError(400)', async () => {
        const { req, res, next } = makeReqRes({
            text: '',
            _context: { documentId: '10001234' },
        }, { id: 'task-1' });
        await new InboxController().postComment(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it('rejects missing documentId with AppError(400)', async () => {
        const { req, res, next } = makeReqRes({ text: 'hi' }, { id: 'task-1' });
        await new InboxController().postComment(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it('rejects non-string text with AppError(400)', async () => {
        const { req, res, next } = makeReqRes({ text: 12345, _context: { documentId: '10001234' } }, { id: 'task-1' });
        await new InboxController().postComment(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it('forwards successful result', async () => {
        mockAddComment.mockResolvedValue(undefined);
        const { req, res, next } = makeReqRes({
            text: 'Looks good',
            _context: { documentId: '10001234', businessObjectType: 'PR' },
        }, { id: 'task-1' });
        await new InboxController().postComment(req, res, next);
        expect(mockAddComment).toHaveBeenCalledWith('10001234', 'Looks good', 'MOCK_USER', expect.any(Object));
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(next).not.toHaveBeenCalled();
    });
});
