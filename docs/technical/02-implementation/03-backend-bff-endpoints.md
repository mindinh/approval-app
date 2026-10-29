# Backend BFF REST API Reference

> **Owner:** Project Team | **Last Updated:** 2026-10-20 | **Status:** Active

All paths below are relative to `/api/cnma/APPROVAL_SRV`. The [task router](../../../srv/handlers/inbox-handler.ts) mounts at `/tasks`; there is no second `/tasks` segment.

## Mounted REST operations

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/tasks/notification/test-destination` | Resolve SAP_Notifications destination |
| GET | `/tasks/notification/types` | List notification types |
| POST | `/tasks/notification/create-type` | Register notification type |
| DELETE | `/tasks/notification/type` | Delete notification type |
| POST | `/tasks/notification/send-test` | Send test notification |
| GET | `/tasks/debug/current-user` | Diagnostics for current identity |
| GET | `/tasks/debug/jwt` | Inspect JWT diagnostics |
| GET | `/tasks/debug/auth-summary` | Inspect authentication configuration |
| GET | `/tasks/me/sap-user` | Resolve current SAP business user |
| GET | `/tasks/me` | Resolved user profile |
| GET | `/tasks/dashboard` | Dashboard aggregation |
| GET | `/tasks/status-counts` | Task counts by workflow status |
| GET | `/tasks/category-counts` | Task counts by category |
| GET | `/tasks` | Active workflow tasks |
| GET | `/tasks/approved` | Processed workflow tasks |
| GET | `/tasks/{id}` | Raw business object and taskprocessing detail |
| GET | `/tasks/{id}/overview` | Task overview |
| GET | `/tasks/{id}/information` | Task information |
| GET | `/tasks/{id}/workflow-approval-tree` | Workflow approval tree |
| POST | `/tasks/{id}/comments` | Add document comment and optional mentions |
| GET | `/tasks/attachments/{attachId}/content` | Stream attachment content |
| GET | `/tasks/attachments/{attachId}/content/{fileName}` | Stream attachment content |
| GET | `/tasks/{id}/attachments/{attId}/content` | Stream attachment content |
| GET | `/tasks/{id}/attachments/{attId}/content/{fileName}` | Stream attachment content |
| GET | `/tasks/pr/{docNum}` | Reference PR detail with actions disabled |
| GET | `/tasks/pr/{docNum}/attachments` | Reference PR attachment metadata |
| GET | `/tasks/pr/{docNum}/attachments/{attachId}/content` | Stream reference PR attachment |
| GET | `/tasks/pr/{docNum}/attachments/{attachId}/content/{fileName}` | Stream reference PR attachment |
| POST | `/tasks/{id}/decision` | Execute task decision |
| POST | `/tasks/mass-decision` | Execute bulk decisions |
| GET | `/tasks/search-users` | Search forwarding users |
| GET | `/tasks/bus-users` | Search business users for mentions |
| POST | `/tasks/{id}/forward` | Forward task to SAP user |
| GET | `/health` | BFF health |
| GET | `/debug-config` | Legacy mapping configuration notice |

## Query parameters and responses

- Active and approved lists accept `top`, `skip`, `category` (`PR`, `PO`, `RESERVATION`, `CLAIM`) and `search`. They return `{ items, total }`.
- Dashboard accepts `top` (default 50), `skip` (default 0), `category`, `documentType`, and `status` (`In Approving` or `Completed`). It returns `{ statusCounts, docTypeCounts, items, total }`.
- Status counts return `{ total, inApproval, completed }`. Category counts accept `scope=my|approved` and return category counts, `ALL` and `complete`; unavailable category counts are `null`.
- Task detail returns a raw `businessObject` plus `taskprocessing`. It resolves the task id in the processor; the controller does not read historical `typeid`, `instid`, `businessObjectType` or `documentId` query hints for this route.
- Workflow approval tree accepts `documentId` and `businessObjectType`.
- User searches accept `SearchPattern`, `q` or `searchPattern` and return `{ value }`.
- PR attachment metadata returns `{ attachments, count }`, not a bare array. PR detail returns its reference envelope with `normalTask: false`, disabled forward/comments, `task: null`, and empty `decisionOptions`.
- Attachment downloads accept `disposition=inline|attachment`. General downloads accept `documentId` and object type aliases (`objectType`, `docCategory`, `type`); the task-specific route attempts to resolve missing context from task detail. Generic downloads without task id need document context.
- `fileName` is optional in all three attachment route families. PR streaming accepts it for URL compatibility but uses the SAP filename; general streaming uses it as a fallback. Binary responses preserve MIME/disposition handling.

## Action request contracts

`POST /tasks/{id}/decision` requires `decisionKey` or `sapDecisionKey`. Optional fields are `comment`, `approverNumber` and `_context` (document/type/approver context). It returns `{ success: true, result }`.

`POST /tasks/mass-decision` requires either decision key and a nonempty `items` array. Items supply `instanceId` and may carry `documentId`, `documentNumber`, `businessObjectType`, and `sapOrigin`. The response includes `success`, decision key, totals, succeeded/failed counts and per-item results.

`POST /tasks/{id}/comments` requires nonempty `text` up to 255 characters and a document id in `_context.documentId` or the `documentId` query. Optional fields include `objectType`, `taskId`, `approverNumber`, and `taggedUsers`/`TAGGEDUSER` (username/email pairs). It returns `{ success: true, message: "Comment added successfully." }`.

`POST /tasks/{id}/forward` requires `forwardTo` up to 12 characters. Optional `comment` and `_context` are passed to the processor. It returns `{ success: true, result }`.

Normal-task/CC capability checks are performed by the existing processor/decision strategies. Do not infer approval rights from the presence of a documented API.

## Notification REST administration

All five REST actions call `NotificationController.isAdmin()`; its actual conditions are documented in [security architecture](../01-architecture/02-auth-security.md).

- `test-destination` resolves `SAP_Notifications`; `types` lists registered types.
- `create-type` accepts optional `key` and `version`.
- `DELETE type` requires `id` in query/body, or body `key`; `version` defaults to `1.0`.
- `send-test` accepts endpoint, origin/type identifiers, version, priority, title/subtitle/description, recipient, properties or a custom payload. Legacy `eventType`, `subject`, and `body` aliases are accepted.
- Error responses from this controller use `{ success: false, message }`; diagnostic and global middleware errors have their own envelopes.

## CAP notification actions

[service.cds](../../../srv/service.cds) also defines `ApprovalService` at `/api/cnma/APPROVAL_SRV` and `NotificationService` at `/api/cnma/NotificationService`, each with `testNotificationDestination()` and `sendTestNotification(eventType, subject, body)`.
Handlers are in [service.ts](../../../srv/service.ts). CAP owns their OData protocol/metadata; these actions are separate from the Express REST specification and REST admin guard.

## Diagnostics, errors and validation

Health returns `{ status, service, timestamp }`. `debug-config` returns a deprecated-mapping notice. JWT diagnostics can return HTTP 400 for missing/invalid tokens.
Global REST error middleware returns `{ error: { message, code } }`. Binary-not-found responses are text; notification errors use the controller envelope described above.

[Swagger UI](../04-reference/02-swagger-api-placeholder.md) runs at `/api/cnma/APPROVAL_SRV/api-docs`. Validate source route parity with:

```powershell
npx.cmd vitest run tests/unit/documentation/openapi.test.ts
```
