# Roles and Permissions

> **Owner:** Business Analyst | **Last Updated:** 2026-10-20 | **Status:** Active

## Business responsibilities

Business approvers review requests, inspect details and attachments, comment, mention colleagues and act on tasks assigned to them.
Solution administrators manage operational diagnostics and notification testing. Administrative access does not replace the ERP authorization needed for a task.

| Capability | Actionable task | CC / review-only task | Reference PR |
| --- | --- | --- | --- |
| Read document and attachments | Yes | Yes | Yes |
| Comment / mention | When enabled | When enabled | No |
| Approve / reject | Subject to task capability and ERP authorization | No | No |
| Bulk decision | Eligible selected tasks | Excluded | No |
| Forward | Subject to task capability and ERP authorization | No | No |

Completed tasks are presented as history. Available actions depend on the document, task state and backend result.

## Access boundaries

The deployed application uses BTP sign-in through the application router. Task capability checks in the backend block decisions and forwarding for CC tasks.
Notification REST administration has an administrator check, with development and mock-identity exceptions described in the technical security reference.
The current task REST router does not enforce a universal per-route user/admin scope matrix. Health, Swagger and diagnostic access should not be described as administrator-only when that restriction is absent in the server.

Local mocked authentication does not provide offline SAP business data. SAP-side authorization and configured connection identity remain relevant.
See [security architecture](../technical/01-architecture/02-auth-security.md) for implementation boundaries and [user guide](../product/02-user-guide.md) for task interactions.
