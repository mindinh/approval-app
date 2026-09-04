# Roles & Permissions

> **Owner:** Lead Business Analyst | **Last Updated:** 2026-09-03 | **Status:** Active

This document outlines the user roles, business capabilities, and security matrix governing access to the **CNMA Approval** portal.

---

## 👥 Role Descriptions

The application defines two principal user roles that control the capabilities available in the user interface and REST endpoints:

### 1. Business Approver (Standard User)
*   **Target Audience**: Managers, Department Heads, Executives, Procurement Officers.
*   **Core Purpose**: Reviewing pending items, reading detail grids, viewing attachments, posting comments, tagging business users, executing approval/rejection decisions, and forwarding tasks.
*   **Restrictions**: Cannot access developer utility screens or raw security tokens.
*   **CC Task Restrictions**: When viewing Carbon Copy (CC) tasks, business approvers can view document details and add comments/tags, but cannot perform Approve, Reject, Mass Decision, or Forward actions (prohibited and excluded at both UI and backend levels).

### 2. Solution Administrator (Admin User)
*   **Target Audience**: IT Support, System Administrators, DevOps Engineers.
*   **Core Purpose**: Monitoring connections, debugging JWT structures, performing health checks, and accessing technical connection parameters.
*   **Additional Capabilities**: Access to authentication debugger dashboards.

---

## 📊 Business Security Matrix

The table below maps business functions to the respective user roles, task classifications, and required system authorization scopes:

| Business Feature / Function | Standard Task | CC Task | Solution Admin | Required BTP Security Scope |
| :--- | :---: | :---: | :---: | :--- |
| **View Dashboard Metrics** | ✅ | ✅ | ✅ | `.user` or `.admin` |
| **Read Active Inbox Tasks** | ✅ | ✅ | ✅ | `.user` or `.admin` |
| **View Task Details & Items** | ✅ | ✅ | ✅ | `.user` or `.admin` |
| **Post Comments & Tag Users** | ✅ | ✅ | ✅ | `.user` or `.admin` |
| **Stream & Preview Attachments** | ✅ | ✅ | ✅ | `.user` or `.admin` |
| **Approve / Reject Single Task** | ✅ | ❌ | ✅ | `.user` or `.admin` |
| **Mass Approve / Reject Tasks** | ✅ | ❌ | ✅ | `.user` or `.admin` |
| **Forward / Delegate Task** | ✅ | ❌ | ✅ | `.user` or `.admin` |
| **View Historical Approvals** | ✅ | ✅ | ✅ | `.user` or `.admin` |
| **View Debugger Dashboard** | ❌ | ❌ | ✅ | `.admin` |
| **Access Connection Health Checks**| ❌ | ❌ | ✅ | `.admin` |

---

## 🛠️ Security Enforcement Principles

*   **BTP IAS / XSUAA Authentication**: Every request made from the frontend to the backend BFF must be signed with a valid JSON Web Token (JWT) issued by the BTP Identity Authentication Service (IAS) or Extended Services for User Account and Authentication (XSUAA).
*   **Scope & Task Type Checking**: Endpoint routers and the decision strategy engine verify both BTP security scope (`.user` / `.admin`) and task capability flags (`isCcTask` / `canForward`) before executing decisions or forwarding requests.
*   **Mock Fallback**: In local development environments, when the SAP backend profile is mocked, authentication checks fallback to a development username claim (`MOCK_USER` with local admin scopes) to facilitate offline testing.
