# Swagger API Documentation (Planned)

This document serves as a structural placeholder for the upcoming **Swagger / Open API Specification (OAS)** documentation.

---

## 📅 Roadmap Strategy

While current API configurations are documented in the [Backend BFF REST API Reference](../02-implementation/03-backend-bff-endpoints.md), we plan to add interactive Swagger UI testing capabilities in the next phase of development.

The integration strategy involves:
1.  **Swagger UI Middleware**: Mounting `swagger-ui-express` directly in [server.ts](file:///d:/learning/test/cnma_approval/srv/server.ts) under the route `/api/cnma/APPROVAL_SRV/api-docs`.
2.  **OAS Spec Generation**: Generating `swagger.json` statically or dynamically using annotations (e.g. `swagger-jsdoc`) in the handler routers.
3.  **Local & Dev Deployment**: Exposing the interactive Swagger playground on development and staging environments, allowing front-end developers to perform sandboxed API tests.

---

## 🎯 Target Spec Outline

The Swagger spec will cover:
*   **Authentication Schemes**: OpenAPI security schemes defining bearer token (`BearerAuth`) headers, IAS proxy headers, and local impersonation headers.
*   **Path Mapping**: Accurate definitions of path variables (e.g. `instanceId`, `attachId`) and query pagination fields.
*   **Payload Models**: Complete JSON schemas defining Task Details objects, decision action bodies, and error response envelopes.
