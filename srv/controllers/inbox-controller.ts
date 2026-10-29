import { Request, Response, NextFunction } from 'express';
import { InboxProcessor } from '../lib/processors/inbox-processor';
import { AppError } from '../lib/utils/error-handler';
import { detectMimeFromBuffer, cleanFileName } from '../lib/utils/file-helper';
import {
    ensureString,
    ensureOptionalString,
    ensureObject,
    ensureArray,
} from '../lib/utils/request-validator';
import {
    resolveIdentity,
    getSapUser,
    getIdentity,
    extractJwtFromRequest,
    decodeJwtPayload,
    summarizeJwtClaims,
    redactToken,
    hasHeaderValue
} from '../lib/utils/auth-helper';

// Helper function to read raw request body stream
const readRawBody = (req: Request): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', (err) => reject(err));
    });
};

export class InboxController {
    private readonly processor = new InboxProcessor();



    /**
     * @openapi
     * /tasks/debug/current-user:
     *   get:
     *     summary: Diagnostics for current identity
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    getDebugCurrentUser = (req: Request, res: Response): void => {
        const sapUser = getSapUser(req);
        const jwtInfo = extractJwtFromRequest(req);
        const payload = jwtInfo.token ? decodeJwtPayload(jwtInfo.token) : undefined;

        res.json({
            id: sapUser,
            sapUser: sapUser,
            isImpersonated: req.headers['x-sap-user'] !== undefined,
            hasJwt: Boolean(jwtInfo.token),
            tokenSource: jwtInfo.source,
            jwt: jwtInfo.token || null,
            claims: payload ? summarizeJwtClaims(payload) : null,
        });
    };



    /**
     * @openapi
     * /tasks/debug/jwt:
     *   get:
     *     summary: Inspect JWT diagnostics
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    getDebugJwt = (req: Request, res: Response): void => {
        const jwtInfo = extractJwtFromRequest(req);
        if (!jwtInfo.token) {
            res.status(400).json({
                error: 'No JWT found',
                hint: 'Expected Authorization, x-approuter-authorization, x-forwarded-access-token, or x-user-token',
            });
            return;
        }

        const payload = decodeJwtPayload(jwtInfo.token);
        if (!payload) {
            res.status(400).json({
                error: 'JWT payload decode failed',
                tokenSource: jwtInfo.source,
            });
            return;
        }

        res.json({
            tokenSource: jwtInfo.source,
            token: jwtInfo.token,
            tokenPreview: redactToken(jwtInfo.token),
            claims: summarizeJwtClaims(payload),
            rawPayload: payload,
        });
    };



    /**
     * @openapi
     * /tasks/debug/auth-summary:
     *   get:
     *     summary: Inspect authentication configuration
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    getDebugAuthSummary = (req: Request, res: Response): void => {
        const sapUser = getSapUser(req);
        const jwtInfo = extractJwtFromRequest(req);
        const payload = jwtInfo.token ? decodeJwtPayload(jwtInfo.token) : undefined;

        res.json({
            authHeaders: {
                authorization: hasHeaderValue(req.headers.authorization),
                approuterAuthorization: hasHeaderValue(req.headers['x-approuter-authorization']),
                forwardedAuthorization: hasHeaderValue(req.headers['x-forwarded-authorization']),
                forwardedAccessToken: hasHeaderValue(req.headers['x-forwarded-access-token']),
                xUserToken: hasHeaderValue(req.headers['x-user-token']),
            },
            identity: {
                btpUser: sapUser,
                sapUser: sapUser,
                isImpersonated: req.headers['x-sap-user'] !== undefined,
                hasJwt: Boolean(jwtInfo.token),
            },
            sapContext: {
                authMode: process.env.SAP_USE_DESTINATION === 'true' ? 'principal-propagation' : 'technical-user',
                propagationExpected: process.env.SAP_USE_DESTINATION === 'true',
                sapUser: sapUser,
                destinationName: process.env.SAP_TASK_DESTINATION?.trim() || null,
            },
            claims: payload ? summarizeJwtClaims(payload) : null,
        });
    };



    /**
     * @openapi
     * /tasks/me/sap-user:
     *   get:
     *     summary: Resolve current SAP business user
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    getCurrentSapUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { sapUser, userJwt } = resolveIdentity(req);
            res.setHeader('Cache-Control', 'private, no-store');
            res.json(await this.processor.getCurrentSapUser(sapUser, userJwt));
        } catch (error) {
            next(error);
        }
    };


    /**
     * @openapi
     * /tasks/me:
     *   get:
     *     summary: Resolved user profile
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    getMe = (req: Request, res: Response): void => {
        const { sapUser, userJwt } = resolveIdentity(req);
        
        let firstName = '';
        let lastName = '';
        let role = 'User';
        
        if (userJwt) {
            const payload = decodeJwtPayload(userJwt);
            if (payload) {
                firstName = String(payload.given_name || '').trim();
                lastName = String(payload.family_name || '').trim();
                
                const scopes = payload.scope as string[] | undefined;
                if (Array.isArray(scopes)) {
                    const hasAdmin = scopes.some(s => s.endsWith('.admin'));
                    const hasUser = scopes.some(s => s.endsWith('.user'));
                    if (hasAdmin) {
                        role = 'Admin';
                    } else if (hasUser) {
                        role = 'User';
                    }
                }
            }
        }
        
        if (!firstName && !lastName) {
            if (sapUser === 'MOCK_USER') {
                firstName = 'Mock';
                lastName = 'Developer';
                role = 'Admin';
            } else if (sapUser.includes('@')) {
                const parts = sapUser.split('@')[0].split('.');
                firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'SAP';
                lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'User';
            } else {
                firstName = sapUser;
                lastName = '';
            }
        }
        
        res.json({
            id: sapUser,
            sapUser,
            // Local mock sessions write as the explicitly configured Basic Auth user.
            // Never infer ownership from a shared technical account in deployed sessions.
            ...(!userJwt && sapUser === 'MOCK_USER' && process.env.NODE_ENV !== 'production'
                && !process.env.VCAP_APPLICATION && process.env.SAP_USE_DESTINATION === 'false'
                && process.env.SAP_SEND_USER_HEADER !== 'true' && process.env.SAP_TASK_USER?.trim()
                ? { commentAuthorId: process.env.SAP_TASK_USER.trim().toUpperCase() } : {}),
            displayName: `${firstName} ${lastName}`.trim(),
            firstName,
            lastName,
            role,
            email: sapUser.includes('@') ? sapUser.toLowerCase() : `${sapUser.toLowerCase()}@${process.env.DEFAULT_EMAIL_DOMAIN || 'conarum.com'}`
        });
    };





    /**
     * @openapi
     * /tasks/dashboard:
     *   get:
     *     summary: Dashboard aggregation
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: query
     *         name: top
     *         schema:
     *           type: integer
     *       - in: query
     *         name: skip
     *         schema:
     *           type: integer
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *           enum:
     *             - PR
     *             - PO
     *             - RESERVATION
     *             - CLAIM
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum:
     *             - In Approving
     *             - Completed
     *       - in: query
     *         name: documentType
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { sapUser, userJwt } = resolveIdentity(req);
            const status = req.query.status === 'Completed' || req.query.status === 'In Approving'
                ? req.query.status
                : undefined;
            const result = await this.processor.getDashboardSummary(sapUser, userJwt, {
                top: req.query.top ? parseInt(String(req.query.top), 10) : 50,
                skip: req.query.skip ? parseInt(String(req.query.skip), 10) : 0,
                category: this.parseTaskCategory(req.query.category),
                documentType: typeof req.query.documentType === 'string' ? req.query.documentType : undefined,
                status,
            });
            res.json(result);
        } catch (error) {
            next(error);
        }
    };



    /**
     * @openapi
     * /tasks/status-counts:
     *   get:
     *     summary: Task counts by workflow status
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    getStatusCounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { sapUser, userJwt } = resolveIdentity(req);
            res.json(await this.processor.getStatusCounts(sapUser, userJwt));
        } catch (error) {
            next(error);
        }
    };


    /**
     * @openapi
     * /tasks/category-counts:
     *   get:
     *     summary: Task counts by category
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: query
     *         name: scope
     *         schema:
     *           type: string
     *           enum:
     *             - my
     *             - approved
     *           default: my
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    getCategoryCounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { sapUser, userJwt } = resolveIdentity(req);
            const scope = (req.query.scope as string) === 'approved' ? 'approved' : 'my';
            const counts = await this.processor.getCategoryCounts(sapUser, scope, userJwt);
            res.json(counts);
        } catch (error) {
            next(error);
        }
    };



    /**
     * @openapi
     * /tasks:
     *   get:
     *     summary: Active workflow tasks
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: query
     *         name: top
     *         schema:
     *           type: integer
     *       - in: query
     *         name: skip
     *         schema:
     *           type: integer
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *           enum:
     *             - PR
     *             - PO
     *             - RESERVATION
     *             - CLAIM
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 items:
     *                   type: array
     *                   items:
     *                     type: object
     *                     additionalProperties: true
     *                 total:
     *                   type: number
     */
    getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { sapUser, userJwt } = resolveIdentity(req);
            const top = req.query.top ? parseInt(String(req.query.top), 10) : undefined;
            const skip = req.query.skip ? parseInt(String(req.query.skip), 10) : undefined;
            const category = this.parseTaskCategory(req.query.category);
            const search = typeof req.query.search === 'string' ? req.query.search : undefined;

            const result = await this.processor.getTasks(sapUser, userJwt, { top, skip }, { category, search });
            res.json({
                items: result.items,
                total: result.total
            });
        } catch (error) {
            next(error);
        }
    };



    /**
     * @openapi
     * /tasks/approved:
     *   get:
     *     summary: Processed workflow tasks
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: query
     *         name: top
     *         schema:
     *           type: integer
     *       - in: query
     *         name: skip
     *         schema:
     *           type: integer
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *           enum:
     *             - PR
     *             - PO
     *             - RESERVATION
     *             - CLAIM
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 items:
     *                   type: array
     *                   items:
     *                     type: object
     *                     additionalProperties: true
     *                 total:
     *                   type: number
     */
    getApprovedTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { sapUser, userJwt } = resolveIdentity(req);
            const top = req.query.top ? parseInt(String(req.query.top), 10) : undefined;
            const skip = req.query.skip ? parseInt(String(req.query.skip), 10) : undefined;
            const category = this.parseTaskCategory(req.query.category);
            const search = typeof req.query.search === 'string' ? req.query.search : undefined;

            const result = await this.processor.getApprovedTasks(sapUser, userJwt, { top, skip }, { category, search });
            res.json({
                items: result.items,
                total: result.total
            });
        } catch (error) {
            next(error);
        }
    };

    private parseTaskCategory(value: unknown): 'PR' | 'PO' | 'RESERVATION' | 'CLAIM' | undefined {
        return value === 'PR' || value === 'PO' || value === 'RESERVATION' || value === 'CLAIM'
            ? value
            : undefined;
    }



    /**
     * @openapi
     * /tasks/{id}:
     *   get:
     *     summary: Raw business object and taskprocessing detail
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    getTaskDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const instanceId = String(req.params.id || '');
            const { sapUser, userJwt } = resolveIdentity(req);
            const detail = await this.processor.getTaskDetail(instanceId, sapUser, userJwt);
            res.json(detail);
        } catch (error) {
            next(error);
        }
    };



    /**
     * @openapi
     * /tasks/{id}/overview:
     *   get:
     *     summary: Task overview
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    getTaskOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const instanceId = String(req.params.id || '');
            const { sapUser, userJwt } = resolveIdentity(req);
            const detail = await this.processor.getTaskDetail(instanceId, sapUser, userJwt);
            res.json(detail);
        } catch (error) {
            next(error);
        }
    };



    /**
     * @openapi
     * /tasks/{id}/information:
     *   get:
     *     summary: Task information
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    getTaskInformation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const instanceId = String(req.params.id || '');
            const { sapUser, userJwt } = resolveIdentity(req);
            const detail = await this.processor.getTaskDetail(instanceId, sapUser, userJwt);
            res.json(detail);
        } catch (error) {
            next(error);
        }
    };



    /**
     * @openapi
     * /tasks/{id}/workflow-approval-tree:
     *   get:
     *     summary: Workflow approval tree
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: documentId
     *         schema:
     *           type: string
     *       - in: query
     *         name: businessObjectType
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    getWorkflowApprovalTree = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const docNum = req.query.documentId ? String(req.query.documentId) : '';
            const businessObjectType = req.query.businessObjectType ? String(req.query.businessObjectType) : undefined;
            const instanceId = req.params.id ? String(req.params.id) : undefined;
            const { sapUser, userJwt } = resolveIdentity(req);
            const result = await this.processor.getWorkflowApprovalTree(docNum, sapUser, userJwt, instanceId, businessObjectType);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };



    /**
     * @openapi
     * /tasks/{id}/comments:
     *   post:
     *     summary: Add document comment and optional mentions
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: documentId
     *         schema:
     *           type: string
     *         description: Required unless supplied in _context.documentId
     *       - in: query
     *         name: objectType
     *         schema:
     *           type: string
     *       - in: query
     *         name: approverNumber
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - text
     *             properties:
     *               text:
     *                 type: string
     *                 maxLength: 255
     *               objectType:
     *                 type: string
     *               taskId:
     *                 type: string
     *               approverNumber:
     *                 type: string
     *               _context:
     *                 type: object
     *                 properties:
     *                   documentId:
     *                     type: string
     *                   businessObjectType:
     *                     type: string
     *                   objectType:
     *                     type: string
     *                   approverNumber:
     *                     type: string
     *               taggedUsers:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     USERNAME:
     *                       type: string
     *                     EMAIL:
     *                       type: string
     *               TAGGEDUSER:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     USERNAME:
     *                       type: string
     *                     EMAIL:
     *                       type: string
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    postComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = ensureObject(req.body, 'body');
            const _context = ensureObject(body._context, '_context');
            const text = ensureString(body.text, 'text', { maxLength: 255 });
            const docNum = ensureString(_context.documentId || req.query.documentId, 'documentId');
            const targetType = String(body.objectType || _context.objectType || _context.businessObjectType || _context.type || req.query.objectType || '').toUpperCase().trim();
            const currentTaskId = String(req.params.id || body.taskId || body.instanceId || _context.instanceId || '');
            const approverNumber = body.approverNumber || _context.approverNumber || req.query.approverNumber ? String(body.approverNumber || _context.approverNumber || req.query.approverNumber) : undefined;

            const { sapUser, userJwt } = resolveIdentity(req);

            const taggedUsersRaw = ensureArray(body.taggedUsers, 'taggedUsers');
            const taggedUsersUpper = ensureArray(body.TAGGEDUSER, 'TAGGEDUSER');
            const rawTags = taggedUsersRaw.length > 0 ? taggedUsersRaw : taggedUsersUpper;
            const formattedTaggedUsers = rawTags.map((u: any) => ({
                USERNAME: String(u?.USERNAME || u?.username || u?.SAPUserName || '').trim(),
                EMAIL: String(u?.EMAIL || u?.email || u?.EmailAddress || '').trim(),
            }));

            await this.processor.addComment(docNum, text, sapUser, {
                userJwt,
                objectType: targetType,
                taskId: currentTaskId,
                taggedUsers: formattedTaggedUsers,
                approverNumber,
            });
            res.json({ success: true, message: 'Comment added successfully.' });
        } catch (error) {
            next(error);
        }
    };



    /**
     * @openapi
     * /tasks/attachments/{attachId}/content:
     *   get:
     *     summary: Stream attachment content
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: attachId
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: documentId
     *         schema:
     *           type: string
     *         description: Needed when no task id can resolve the document
     *       - in: query
     *         name: objectType
     *         schema:
     *           type: string
     *       - in: query
     *         name: docCategory
     *         schema:
     *           type: string
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *       - in: query
     *         name: disposition
     *         schema:
     *           type: string
     *           enum:
     *             - inline
     *             - attachment
     *           default: inline
     *     responses:
     *       '200':
     *         description: Binary attachment
     *         content:
     *           application/octet-stream:
     *             schema:
     *               type: string
     *               format: binary
     *       '404':
     *         description: Attachment not found
     * /tasks/attachments/{attachId}/content/{fileName}:
     *   get:
     *     summary: Stream attachment content
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: attachId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: fileName
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: documentId
     *         schema:
     *           type: string
     *         description: Needed when no task id can resolve the document
     *       - in: query
     *         name: objectType
     *         schema:
     *           type: string
     *       - in: query
     *         name: docCategory
     *         schema:
     *           type: string
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *       - in: query
     *         name: disposition
     *         schema:
     *           type: string
     *           enum:
     *             - inline
     *             - attachment
     *           default: inline
     *     responses:
     *       '200':
     *         description: Binary attachment
     *         content:
     *           application/octet-stream:
     *             schema:
     *               type: string
     *               format: binary
     *       '404':
     *         description: Attachment not found
     * /tasks/{id}/attachments/{attId}/content:
     *   get:
     *     summary: Stream attachment content
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: attId
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: documentId
     *         schema:
     *           type: string
     *         description: Needed when no task id can resolve the document
     *       - in: query
     *         name: objectType
     *         schema:
     *           type: string
     *       - in: query
     *         name: docCategory
     *         schema:
     *           type: string
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *       - in: query
     *         name: disposition
     *         schema:
     *           type: string
     *           enum:
     *             - inline
     *             - attachment
     *           default: inline
     *     responses:
     *       '200':
     *         description: Binary attachment
     *         content:
     *           application/octet-stream:
     *             schema:
     *               type: string
     *               format: binary
     *       '404':
     *         description: Attachment not found
     * /tasks/{id}/attachments/{attId}/content/{fileName}:
     *   get:
     *     summary: Stream attachment content
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: attId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: fileName
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: documentId
     *         schema:
     *           type: string
     *         description: Needed when no task id can resolve the document
     *       - in: query
     *         name: objectType
     *         schema:
     *           type: string
     *       - in: query
     *         name: docCategory
     *         schema:
     *           type: string
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *       - in: query
     *         name: disposition
     *         schema:
     *           type: string
     *           enum:
     *             - inline
     *             - attachment
     *           default: inline
     *     responses:
     *       '200':
     *         description: Binary attachment
     *         content:
     *           application/octet-stream:
     *             schema:
     *               type: string
     *               format: binary
     *       '404':
     *         description: Attachment not found
     */
    streamAttachment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const attId = String(req.params.attachId || req.params.attId);
            let docNum = req.query.documentId ? String(req.query.documentId) : '';
            const { sapUser, userJwt } = resolveIdentity(req);

            let objectType = req.query.objectType ? String(req.query.objectType) : (req.query.docCategory ? String(req.query.docCategory) : (req.query.type ? String(req.query.type) : undefined));

            const taskId = String(req.params.id || '');
            if ((!docNum || docNum === 'undefined' || !objectType) && taskId && taskId !== 'undefined') {
                try {
                    const detail: any = await this.processor.getTaskDetail(taskId, sapUser, userJwt);
                    docNum = docNum || detail.taskprocessing?.task?.businessContext?.documentId || detail.businessObject?.DocumentNumber || detail.businessObject?.PurchaseRequisition || detail.businessObject?.PurchaseOrder || '';
                    objectType = objectType || detail.objectType || detail.businessObject?.DocCategory;
                } catch (e: any) {
                    console.warn(`Failed to resolve task detail for task ${taskId}: ${e.message}`);
                }
            }

            const file = await this.processor.getAttachmentContent(docNum, attId, sapUser, userJwt, objectType);
            if (!file) {
                res.status(404).send('Attachment not found');
                return;
            }

            const disposition = req.query.disposition === 'attachment' ? 'attachment' : 'inline';
            let contentType = file.contentType || 'application/octet-stream';
            const rawParamFileName = Array.isArray(req.params.fileName) ? req.params.fileName[0] : req.params.fileName;
            let finalFileName = String(file.fileName || rawParamFileName || `attachment_${attId}`);

            // Inspect binary buffer magic bytes
            let detectedExt: string | undefined = undefined;
            if (file.data && Buffer.isBuffer(file.data)) {
                const detected = detectMimeFromBuffer(file.data);
                if (detected) {
                    detectedExt = detected.extension;
                    // Upgrade generic/octet-stream or legacy xls content type when buffer is modern xlsx/docx
                    if (
                        !contentType ||
                        contentType === 'application/octet-stream' ||
                        contentType === 'application/x-forcedownload' ||
                        (contentType === 'application/vnd.ms-excel' && detected.extension === 'xlsx')
                    ) {
                        contentType = detected.mimeType;
                    }
                }
            }

            finalFileName = cleanFileName(finalFileName, detectedExt);
            const encodedFileName = encodeURIComponent(finalFileName);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `${disposition}; filename="${finalFileName}"; filename*=UTF-8''${encodedFileName}`);
            res.send(file.data);
        } catch (error) {
            next(error);
        }
    };



    /**
     * @openapi
     * /tasks/pr/{docNum}:
     *   get:
     *     summary: Reference PR detail with actions disabled
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: docNum
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    getPrDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const docNum = String(req.params.docNum || '');
            const { sapUser, userJwt } = resolveIdentity(req);
            const detail = await this.processor.getPrDetail(docNum, sapUser, userJwt);
            res.json(detail);
        } catch (error) {
            next(error);
        }
    };



    /**
     * @openapi
     * /tasks/pr/{docNum}/attachments:
     *   get:
     *     summary: Reference PR attachment metadata
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: docNum
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 attachments:
     *                   type: array
     *                   items:
     *                     type: object
     *                     additionalProperties: true
     *                 count:
     *                   type: integer
     */
    getPrAttachments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const docNum = String(req.params.docNum);
            const { sapUser, userJwt } = resolveIdentity(req);
            const attachments = await this.processor.getPrAttachments(docNum, sapUser, userJwt);

            res.json({
                attachments,
                count: attachments.length
            });
        } catch (error) {
            next(error);
        }
    };



    /**
     * @openapi
     * /tasks/pr/{docNum}/attachments/{attachId}/content:
     *   get:
     *     summary: Stream reference PR attachment
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: docNum
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: attachId
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: disposition
     *         schema:
     *           type: string
     *           enum:
     *             - inline
     *             - attachment
     *           default: inline
     *     responses:
     *       '200':
     *         description: Binary attachment
     *         content:
     *           application/octet-stream:
     *             schema:
     *               type: string
     *               format: binary
     *       '404':
     *         description: Attachment not found
     * /tasks/pr/{docNum}/attachments/{attachId}/content/{fileName}:
     *   get:
     *     summary: Stream reference PR attachment
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     description: fileName is accepted for route compatibility; the response uses the SAP filename.
     *     parameters:
     *       - in: path
     *         name: docNum
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: attachId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: fileName
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: disposition
     *         schema:
     *           type: string
     *           enum:
     *             - inline
     *             - attachment
     *           default: inline
     *     responses:
     *       '200':
     *         description: Binary attachment
     *         content:
     *           application/octet-stream:
     *             schema:
     *               type: string
     *               format: binary
     *       '404':
     *         description: Attachment not found
     */
    streamPrAttachment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const docNum = String(req.params.docNum);
            const attachId = String(req.params.attachId);
            const { sapUser, userJwt } = resolveIdentity(req);

            const file = await this.processor.getAttachmentContent(docNum, attachId, sapUser, userJwt);
            if (!file) {
                res.status(404).send('Attachment not found');
                return;
            }

            let contentType = file.contentType || 'application/octet-stream';
            let fileName = file.fileName || `attachment_${attachId}`;
            let detectedExt: string | undefined = undefined;

            if (file.data && Buffer.isBuffer(file.data)) {
                const detected = detectMimeFromBuffer(file.data);
                if (detected) {
                    detectedExt = detected.extension;
                    if (
                        !contentType ||
                        contentType === 'application/octet-stream' ||
                        contentType === 'application/x-forcedownload' ||
                        (contentType === 'application/vnd.ms-excel' && detected.extension === 'xlsx')
                    ) {
                        contentType = detected.mimeType;
                    }
                    if (!fileName.includes('.') || fileName.endsWith('.')) {
                        fileName = `${fileName.replace(/\.+$/, '')}.${detected.extension}`;
                    }
                }
            }

            fileName = cleanFileName(fileName, detectedExt);
            const disposition = req.query.disposition === 'attachment' ? 'attachment' : 'inline';
            const encodedFileName = encodeURIComponent(fileName);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`);
            res.send(file.data);
        } catch (error) {
            next(error);
        }
    };




    /**
     * @openapi
     * /tasks/{id}/decision:
     *   post:
     *     summary: Execute task decision
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               decisionKey:
     *                 type: string
     *               sapDecisionKey:
     *                 type: string
     *               comment:
     *                 type: string
     *               approverNumber:
     *                 type: string
     *               _context:
     *                 type: object
     *                 properties:
     *                   documentId:
     *                     type: string
     *                   businessObjectType:
     *                     type: string
     *                   objectType:
     *                     type: string
     *                   approverNumber:
     *                     type: string
     *             anyOf:
     *               - required:
     *                   - decisionKey
     *               - required:
     *                   - sapDecisionKey
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    postDecision = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const instanceId = ensureString(req.params.id, 'id', { allowEmpty: false });
            const body = ensureObject(req.body, 'body');
            const decisionKey = ensureOptionalString(body.decisionKey, 'decisionKey');
            const sapDecisionKey = ensureOptionalString(body.sapDecisionKey, 'sapDecisionKey');
            const comment = ensureOptionalString(body.comment, 'comment') || '';
            const _context = ensureObject(body._context, '_context');

            const decKey = decisionKey || sapDecisionKey;
            if (!decKey) {
                throw new AppError('Missing decision details in request body', 400);
            }

            const approverNumber = body.approverNumber || _context.approverNumber || (req.query.approverNumber ? String(req.query.approverNumber) : undefined);
            if (approverNumber) {
                _context.approverNumber = approverNumber;
            }

            const { sapUser, userJwt } = resolveIdentity(req);

            const result = await this.processor.executeDecision(
                instanceId,
                decisionKey || decKey,
                sapDecisionKey || decKey,
                comment,
                String(sapUser || ''),
                userJwt,
                _context
            );
            res.json({ success: true, result });
        } catch (error) {
            next(error);
        }
    };



    /**
     * @openapi
     * /tasks/mass-decision:
     *   post:
     *     summary: Execute bulk decisions
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               decisionKey:
     *                 type: string
     *               sapDecisionKey:
     *                 type: string
     *               comment:
     *                 type: string
     *               items:
     *                 type: array
     *                 minItems: 1
     *                 items:
     *                   type: object
     *                   required:
     *                     - instanceId
     *                   properties:
     *                     instanceId:
     *                       type: string
     *                     documentId:
     *                       type: string
     *                     documentNumber:
     *                       type: string
     *                     businessObjectType:
     *                       type: string
     *                     sapOrigin:
     *                       type: string
     *             anyOf:
     *               - required:
     *                   - decisionKey
     *               - required:
     *                   - sapDecisionKey
     *             required:
     *               - items
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    postMassDecision = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = ensureObject(req.body, 'body');
            const decisionKey = ensureOptionalString(body.decisionKey, 'decisionKey');
            const sapDecisionKey = ensureOptionalString(body.sapDecisionKey, 'sapDecisionKey');
            const comment = ensureOptionalString(body.comment, 'comment') || '';
            const items = ensureArray(body.items, 'items');

            const decKey = decisionKey || sapDecisionKey;
            if (!decKey) {
                throw new AppError('Missing decision details in request body', 400);
            }

            if (!items || items.length === 0) {
                throw new AppError('No task items provided for mass decision', 400);
            }

            const { sapUser, userJwt } = resolveIdentity(req);

            const result = await this.processor.executeMassDecision(
                items,
                decisionKey || decKey,
                sapDecisionKey || decKey,
                comment,
                String(sapUser || ''),
                userJwt
            );

            res.json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    };



    /**
     * @openapi
     * /tasks/search-users:
     *   get:
     *     summary: Search forwarding users
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: query
     *         name: SearchPattern
     *         schema:
     *           type: string
     *       - in: query
     *         name: q
     *         schema:
     *           type: string
     *       - in: query
     *         name: searchPattern
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    getSearchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pattern = String(req.query.SearchPattern || req.query.q || req.query.searchPattern || '').trim();
            const { sapUser, userJwt } = resolveIdentity(req);

            const users = await this.processor.searchUsers(pattern, sapUser, userJwt);
            res.json({ value: users });
        } catch (error) {
            next(error);
        }
    };



    /**
     * @openapi
     * /tasks/bus-users:
     *   get:
     *     summary: Search business users for mentions
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: query
     *         name: SearchPattern
     *         schema:
     *           type: string
     *       - in: query
     *         name: q
     *         schema:
     *           type: string
     *       - in: query
     *         name: searchPattern
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    getBusUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pattern = String(req.query.SearchPattern || req.query.q || req.query.searchPattern || '').trim();
            const { sapUser, userJwt } = resolveIdentity(req);

            const users = await this.processor.searchBusUsers(pattern, sapUser, userJwt);
            res.json({ value: users });
        } catch (error) {
            next(error);
        }
    };




    /**
     * @openapi
     * /tasks/{id}/forward:
     *   post:
     *     summary: Forward task to SAP user
     *     tags:
     *       - Tasks
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - forwardTo
     *             properties:
     *               forwardTo:
     *                 type: string
     *                 maxLength: 12
     *               comment:
     *                 type: string
     *               _context:
     *                 type: object
     *                 properties:
     *                   documentId:
     *                     type: string
     *                   businessObjectType:
     *                     type: string
     *                   objectType:
     *                     type: string
     *                   approverNumber:
     *                     type: string
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    postForwardTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const instanceId = ensureString(req.params.id, 'id', { allowEmpty: false });
            const body = ensureObject(req.body, 'body');
            const forwardTo = ensureString(body.forwardTo, 'forwardTo', { maxLength: 12 });
            const comment = ensureOptionalString(body.comment, 'comment') || '';
            const _context = ensureObject(body._context, '_context');

            const { sapUser, userJwt } = resolveIdentity(req);

            const result = await this.processor.forwardTask(
                instanceId,
                forwardTo.trim(),
                comment,
                String(sapUser || ''),
                userJwt,
                _context
            );
            res.json({ success: true, result });
        } catch (error) {
            next(error);
        }
    };


    getFallbackTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { sapUser, userJwt } = resolveIdentity(req);
            const result = await this.processor.getTasks(sapUser, userJwt);
            res.json({ value: result.items });
        } catch (error) {
            next(error);
        }
    };
}

