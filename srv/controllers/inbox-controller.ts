import { Request, Response, NextFunction } from 'express';
import { InboxProcessor } from '../lib/processors/inbox-processor';
import { AppError } from '../lib/utils/error-handler';
import { detectMimeFromBuffer } from '../lib/utils/file-helper';
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
     *     summary: Diagnostics for the current user
     *     description: Checks incoming user identity and BTP JWT authorization details.
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       200:
     *         description: Diagnostic object
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
     *     summary: Diagnostics for raw JWT
     *     description: Returns decoded claims of the incoming JWT token.
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       200:
     *         description: Decoded claims payload
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
     *     summary: Check system auth bindings
     *     description: Checks connection profiles (Destination vs Axios) and header properties.
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       200:
     *         description: Diagnostic auth configuration metrics
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
                destinationName: process.env.SAP_TASK_DESTINATION || 'SAP_ABAP_BACKEND',
            },
            claims: payload ? summarizeJwtClaims(payload) : null,
        });
    };

    /**
     * @openapi
     * /tasks/me:
     *   get:
     *     summary: Resolved user profile
     *     description: Decodes BTP scopes to resolve role configuration (Admin vs User).
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       200:
     *         description: Profile object
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
     *     summary: Fetch dashboard aggregation
     *     description: Merges metrics, statuses, and net amounts.
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       200:
     *         description: Dashboard summary array
     */
    getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { sapUser, userJwt } = resolveIdentity(req);
            const result = await this.processor.getDashboardSummary(sapUser, userJwt);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @openapi
     * /tasks/tasks:
     *   get:
     *     summary: Retrieve active workflow tasks
     *     description: Fetches all pending PR/PO approval tasks for the active user.
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
     *     responses:
     *       200:
     *         description: Standardized tasks array envelope
     */
    getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { sapUser, userJwt } = resolveIdentity(req);
            const top = req.query.top ? parseInt(String(req.query.top), 10) : undefined;
            const skip = req.query.skip ? parseInt(String(req.query.skip), 10) : undefined;

            const result = await this.processor.getTasks(sapUser, userJwt, { top, skip });
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
     * /tasks/tasks/approved:
     *   get:
     *     summary: Retrieve processed tasks history
     *     description: Retrieves the completed workflow items history.
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
     *     responses:
     *       200:
     *         description: Standardized tasks array envelope
     */
    getApprovedTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { sapUser, userJwt } = resolveIdentity(req);
            const top = req.query.top ? parseInt(String(req.query.top), 10) : undefined;
            const skip = req.query.skip ? parseInt(String(req.query.skip), 10) : undefined;

            const result = await this.processor.getApprovedTasks(sapUser, userJwt, { top, skip });
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
     * /tasks/tasks/{id}:
     *   get:
     *     summary: Fetch single task details
     *     description: Retrieves full context for the target task.
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: typeid
     *         schema:
     *           type: string
     *       - in: query
     *         name: instid
     *         schema:
     *           type: string
     *       - in: query
     *         name: businessObjectType
     *         schema:
     *           type: string
     *       - in: query
     *         name: documentId
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Enriched details model
     */
    getTaskDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const instanceId = String(req.params.id || '');
            const { sapUser, userJwt } = resolveIdentity(req);
            const hints = {
                typeid: req.query.typeid ? String(req.query.typeid) : undefined,
                instid: req.query.instid ? String(req.query.instid) : undefined,
                businessObjectType: req.query.businessObjectType ? String(req.query.businessObjectType) : undefined,
                documentId: req.query.documentId ? String(req.query.documentId) : undefined,
                status: req.query.status ? String(req.query.status) : undefined,
            };

            const detail = await this.processor.getTaskDetail(instanceId, sapUser, hints, userJwt);
            res.json(detail);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @openapi
     * /tasks/tasks/{id}/overview:
     *   get:
     *     summary: Fast-path overview
     *     description: Retrieves detailed attributes (maps to getTaskDetail).
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Enriched details model
     */
    getTaskOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const instanceId = String(req.params.id || '');
            const { sapUser, userJwt } = resolveIdentity(req);
            const hints = {
                typeid: req.query.typeid ? String(req.query.typeid) : undefined,
                instid: req.query.instid ? String(req.query.instid) : undefined,
                businessObjectType: req.query.businessObjectType ? String(req.query.businessObjectType) : undefined,
                documentId: req.query.documentId ? String(req.query.documentId) : undefined,
                status: req.query.status ? String(req.query.status) : undefined,
            };

            const detail = await this.processor.getTaskDetail(instanceId, sapUser, hints, userJwt);
            res.json(detail);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @openapi
     * /tasks/tasks/{id}/information:
     *   get:
     *     summary: Fetch informational details
     *     description: Maps to getTaskDetail.
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Enriched details model
     */
    getTaskInformation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const instanceId = String(req.params.id || '');
            const { sapUser, userJwt } = resolveIdentity(req);
            const hints = {
                typeid: req.query.typeid ? String(req.query.typeid) : undefined,
                instid: req.query.instid ? String(req.query.instid) : undefined,
                businessObjectType: req.query.businessObjectType ? String(req.query.businessObjectType) : undefined,
                documentId: req.query.documentId ? String(req.query.documentId) : undefined,
                status: req.query.status ? String(req.query.status) : undefined,
            };

            const detail = await this.processor.getTaskDetail(instanceId, sapUser, hints, userJwt);
            res.json(detail);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @openapi
     * /tasks/tasks/{id}/workflow-approval-tree:
     *   get:
     *     summary: Fetch workflow approval tree
     *     description: Resolves the release strategy hierarchy and signatures log.
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
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Hierarchy log tree
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
     * /tasks/tasks/{id}/comments:
     *   post:
     *     summary: Post a comment message
     *     description: Appends a note into the collaboration thread (synced to ERP).
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
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               text:
     *                 type: string
     *     responses:
     *       200:
     *         description: Success envelope
     */
    postComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = ensureObject(req.body, 'body');
            const _context = ensureObject(body._context, '_context');
            const text = ensureString(body.text, 'text', { maxLength: 255 });
            const docNum = ensureString(_context.documentId || req.query.documentId, 'documentId');
            const targetType = String(body.objectType || _context.objectType || _context.businessObjectType || _context.type || req.query.objectType || '').toUpperCase().trim();
            const currentTaskId = String(req.params.id || body.taskId || body.instanceId || _context.instanceId || '');

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
            });
            res.json({ success: true, message: 'Comment added successfully.' });
        } catch (error) {
            next(error);
        }
    };

    /**
     * @openapi
     * /tasks/tasks/{id}/attachments:
     *   post:
     *     summary: Upload a raw attachment file
     *     description: Uploads a binary file to GOS.
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *       - in: header
     *         name: slug
     *         schema:
     *           type: string
     *       - in: header
     * /tasks/tasks/{id}/attachments/{attId}/content:
     *   get:
     *     summary: Stream attachment binary content
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
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Raw binary file
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
                    const detail: any = await this.processor.getTaskDetail(taskId, sapUser, undefined, userJwt);
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
            const fileNameLower = String(file.fileName || rawParamFileName || '').toLowerCase();

            // Infer PDF content-type if binary starts with %PDF- or filename ends with .pdf
            if (contentType === 'application/octet-stream' || contentType === 'application/x-forcedownload' || !contentType) {
                if (fileNameLower.endsWith('.pdf') || (file.data && file.data.length >= 4 && file.data[0] === 0x25 && file.data[1] === 0x50 && file.data[2] === 0x44 && file.data[3] === 0x46)) {
                    contentType = 'application/pdf';
                } else if (fileNameLower.endsWith('.png')) {
                    contentType = 'image/png';
                } else if (fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg')) {
                    contentType = 'image/jpeg';
                } else if (fileNameLower.endsWith('.gif')) {
                    contentType = 'image/gif';
                } else if (fileNameLower.endsWith('.txt')) {
                    contentType = 'text/plain; charset=utf-8';
                } else if (fileNameLower.endsWith('.csv')) {
                    contentType = 'text/csv; charset=utf-8';
                }
            }

            const encodedFileName = encodeURIComponent(file.fileName);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `${disposition}; filename="${file.fileName}"; filename*=UTF-8''${encodedFileName}`);
            res.send(file.data);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @openapi
     * /tasks/pr/{docNum}/attachments:
     *   get:
     *     summary: Get PR attachments metadata
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: docNum
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Metadata list
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
     *     summary: Stream PR attachment content
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
     *     responses:
     *       200:
     *         description: Raw binary file
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

            if ((!contentType || contentType === 'application/octet-stream' || contentType === 'application/x-forcedownload') && file.data) {
                const detected = detectMimeFromBuffer(file.data);
                if (detected) {
                    contentType = detected.mimeType;
                    if (!fileName.includes('.') || fileName.endsWith('.')) {
                        fileName = `${fileName.replace(/\.+$/, '')}.${detected.extension}`;
                    }
                }
            }

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
     * /tasks/tasks/{id}/decision:
     *   post:
     *     summary: Execute approval/rejection decision
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
     *     responses:
     *       200:
     *         description: Success envelope
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
     * /tasks/search-users:
     *   get:
     *     summary: Search users for task forwarding
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
     *     responses:
     *       200:
     *         description: Array of matched user objects
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
     *     summary: Search CNMA_BUSUSER for CC tagging
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: query
     *         name: q
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Array of matched CNMA_BUSUSER objects
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
     *     summary: Forward task to another user
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
     *               forwardTo:
     *                 type: string
     *               comment:
     *                 type: string
     *     responses:
     *       200:
     *         description: Success envelope
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

    /**
     * @openapi
     * /tasks:
     *   get:
     *     summary: Catch-all fallback list
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       200:
     *         description: List value array
     */
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

