import cds from '@sap/cds';
import express from 'express';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { XssecPassportStrategy, XsuaaService } from '@sap/xssec';
import { createInboxRouter } from './handlers/inbox-handler';
import { AppError } from './lib/utils/error-handler';

cds.on('bootstrap', (app: express.Application) => {
    // Health check
    app.get('/api/cnma/APPROVAL_SRV/health', (_req: express.Request, res: express.Response) => {
        res.json({
            status: 'ok',
            service: 'cnma-approval-bff',
            timestamp: new Date().toISOString()
        });
    });

    // Swagger UI Configuration
    const swaggerOptions: swaggerJsdoc.Options = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'CNMA Approval BFF API Reference',
                version: '1.0.0',
                description: 'REST API documentation for workflow task management and approvals',
            },
            servers: [
                {
                    url: '/api/cnma/APPROVAL_SRV',
                    description: 'Local BFF Service Root',
                }
            ],
            components: {
                securitySchemes: {
                    BearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                        description: 'Enter your BTP IAS/XSUAA JWT authorization token'
                    }
                }
            }
        },
        apis: [
            './srv/controllers/*.ts',
            './srv/controllers/**/*.ts',
            './gen/srv/controllers/*.js'
        ]
    };

    const swaggerSpec = swaggerJsdoc(swaggerOptions);
    app.use('/api/cnma/APPROVAL_SRV/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log('[Server] Swagger documentation mounted at /api/cnma/APPROVAL_SRV/api-docs');

    // Check if real auth/xsuaa is configured and should be enabled
    const authConfig = cds.env.requires.auth;
    if (authConfig && authConfig.kind === 'xsuaa' && authConfig.credentials) {
        try {
            const xsuaaService = new XsuaaService(authConfig.credentials as any);
            passport.use(new XssecPassportStrategy(xsuaaService));
            app.use(passport.initialize());
            
            const shouldEnableJwtAuth = process.env.NODE_ENV === 'production' || process.env.ENABLE_JWT_AUTH === 'true';
            if (shouldEnableJwtAuth) {
                app.use('/api/cnma/APPROVAL_SRV/tasks', passport.authenticate('JWT', { session: false }));
                console.log('[Server] XSUAA JWT authentication middleware enabled for /api/cnma/APPROVAL_SRV/tasks');
            } else {
                console.log('[Server] XSUAA JWT authentication skipped for local development (ENABLE_JWT_AUTH !== true)');
            }
        } catch (err) {
            console.error('[Server] Failed to initialize XSUAA passport strategy:', err);
        }
    } else {
        console.log('[Server] XSUAA authentication not configured or credentials missing in cds.env.requires.auth');
    }

    // Parse bodies
    app.use('/api/cnma/APPROVAL_SRV/tasks', express.json({ limit: '10mb' }));

    // Mount Express Router for Tasks
    app.use('/api/cnma/APPROVAL_SRV/tasks', createInboxRouter());

    console.log('[Server] Approval BFF REST API mounted at /api/cnma/APPROVAL_SRV/tasks');

    // Global Error Handler Middleware
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        console.error('[Server Error Middleware]', err);
        const status = err instanceof AppError ? err.statusCode : 500;
        res.status(status).json({
            error: {
                message: err.message || 'Internal Server Error',
                code: err instanceof AppError ? err.code : 'INTERNAL_SERVER_ERROR'
            }
        });
    });
});

export default cds.server;
