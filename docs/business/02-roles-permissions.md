# Roles & Permissions

This document outlines the user roles, business capabilities, and security matrix governing access to the **CNMA Approval** portal.

---

## 👥 Role Descriptions

The application defines two principal user roles that control the capabilities available in the user interface and REST endpoints:

### 1. Business Approver (Standard User)
*   **Target Audience**: Managers, Department Heads, Executives, Procurement Officers.
*   **Core Purpose**: Reviewing pending items, reading detail grids, viewing attachments, posting comments, and executing approval/rejection decisions.
*   **Restrictions**: Cannot access developer utility screens or raw security tokens.

### 2. Solution Administrator (Admin User)
*   **Target Audience**: IT Support, System Administrators, DevOps Engineers.
*   **Core Purpose**: Monitoring connections, debugging JWT structures, performing health checks, and accessing technical connection parameters.
*   **Additional Capabilities**: Access to authentication debugger dashboards.

---

## 📊 Business Security Matrix

The table below maps business functions to the respective user roles and the required system authorization scopes:

| Business Feature / API Path | Business Approver | Solution Administrator | Required BTP Security Scope |
| :--- | :---: | :---: | :--- |
| **View Dashboard Metrics** | ✅ | ✅ | `.user` or `.admin` |
| **Read Active Inbox Tasks** | ✅ | ✅ | `.user` or `.admin` |
| **View Task Details (Items/Grids)** | ✅ | ✅ | `.user` or `.admin` |
| **Post Comments to Task** | ✅ | ✅ | `.user` or `.admin` |
| **Stream & Preview Attachments** | ✅ | ✅ | `.user` or `.admin` |
| **Upload New Attachments** | ✅ | ✅ | `.user` or `.admin` |
| **Approve / Reject Tasks** | ✅ | ✅ | `.user` or `.admin` |
| **View Historical Approvals** | ✅ | ✅ | `.user` or `.admin` |
| **View JWT Debugger Dashboard** | ❌ | ✅ | `.admin` |
| **Access Connection Health Checks**| ❌ | ✅ | `.admin` |

---

## 🛠️ Security Enforcement Principles

*   **BTP IAS / XSUAA Authentication**: Every request made from the frontend to the backend BFF must be signed with a valid JSON Web Token (JWT) issued by the BTP Identity Authentication Service (IAS) or Extended Services for User Account and Authentication (XSUAA).
*   **Scope Checking**: Endpoint routers check for the presence of the `.admin` or `.user` scope before parsing request bodies. If a user lacks the required scope, they are rejected with an HTTP 403 Forbidden status.
*   **Mock Fallback**: In local development environments, when the SAP backend profile is mocked, authentication checks fallback to a development username claim (`MOCK_USER` with local admin scopes) to facilitate offline testing.
