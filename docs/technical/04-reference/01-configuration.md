# System Configuration & Declarative Renderer Reference

> **Owner:** Lead CAP Architect | **Last Updated:** 2026-08-17 | **Status:** Active

This document provides a reference guide for runtime environment variables, BTP destination settings, OData backend paths, and frontend declarative renderer layout specifications.

---

## 🛰️ OData Backend Services Configuration (`odata-config.ts`)

The backend BFF communicates with SAP S/4HANA via configured OData V4 services defined in [`srv/lib/processors/odata-config.ts`](file:///d:/learning/test/cnma_approval/srv/lib/processors/odata-config.ts):

| Service Key | Default Service Path | Primary Entity Set | Purpose |
| :--- | :--- | :--- | :--- |
| `INSTANCE_LIST` | `/sap/opu/odata4/sap/za_cnma_prorequest/srvd_a2x/sap/za_cnma_prorequest/0001` | `CNMA_WFTASK` | Queries workflow active worklist, status counts, and document type counts. |
| `APPROVAL_SRV` | `/sap/opu/odata4/sap/zsb_prorequest/srvd_a2x/sap/zsd_prorequest/0001` | `CNMA_PRHEADER` / `CNMA_POHEADER` / `CNMA_RESVHEADER` | Fetches document header, line items, workflow release strategy steps, attachments, and comments. |
| `TASK_PROCESSING` | `/sap/opu/odata/IWPGW/TASKPROCESSING/0002` | `TaskCollection` | Workflow task decision operations and task runtime details. |

---

## ⚙️ Environment Variables (`.env`)

The BFF reads environment variables at launch to control connection mode, destinations, ports, and authentication parameters.

| Variable Name | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | No | `4005` | Local port on which Express server mounts. |
| `USE_MOCK_SAP` | No | `true` | **Mock switch**. Set to `false` to fetch details from real S/4HANA systems. Set to `true` (or omit) to use local mock JSON providers. |
| `SAP_USE_DESTINATION` | No | `false` | **Connectivity profile**. Set to `true` to use BTP destination lookup via SAP Cloud SDK. Set to `false` to connect directly using Axios base URLs. |
| `SAP_TASK_DESTINATION` | Conditional | `SAP_ABAP_BACKEND` | Name of the destination configured in BTP to connect to S/4HANA (used when `SAP_USE_DESTINATION=true`). |
| `SAP_TASK_BASE_URL` | Conditional | - | Direct base URL of S/4HANA host (used when `SAP_USE_DESTINATION=false`). |
| `SAP_TASK_CLIENT` | Conditional | - | SAP Client ID (e.g. `100`) passed in HTTP headers. |
| `SAP_TASK_USER` | Conditional | - | Username for direct SAP basic authentication. |
| `SAP_TASK_PASSWORD` | Conditional | - | Password for direct SAP basic authentication. |
| `SAP_DEV_JWT` | No | - | Long-lived test JWT token payload to simulate principal authentication on local requests. |

---

## 🎨 Declarative Renderer Schema Contract (`renderer.types.ts`)

Frontend layout specifications are governed by TypeScript contracts defined in [`app/cnma_approval_ui/src/renderers/core/renderer.types.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/core/renderer.types.ts):

### CardDefinition Interface
```typescript
export interface CardDefinition {
    id: string;
    title: string;
    fields: FieldDefinition[];
    predicate?: PredicateFunction;
}
```

### FieldDefinition Interface
```typescript
export interface FieldDefinition {
    id: string;
    label: string;
    source?: string;
    codeSource?: string;
    textSource?: string;
    valueSource?: string;
    currencySource?: string;
    unitSource?: string;
    timeSource?: string;
    isLongText?: boolean;
    type: 'text' | 'codeText' | 'amount' | 'date' | 'quantity';
    formatter?: (value: any, record?: Record<string, any>) => string;
    predicate?: PredicateFunction;
}
```

### TableDefinition Interface
```typescript
export interface TableDefinition {
    id: string;
    title: string;
    itemSource: string;
    columns: TableColumnDefinition[];
    predicate?: PredicateFunction;
}
```

---

## 🚀 Build & Verification Scripts (`package.json`)

| Command | Description |
| :--- | :--- |
| `npm run dev:all` | Launches both backend BFF and frontend React dev servers concurrently. |
| `npm run test` | Runs complete Vitest backend unit test suite. |
| `cd app/cnma_approval_ui; npx tsc --noEmit` | Performs strict frontend TypeScript typecheck compilation. |
| `npm run clean` | Cleans build output directories (`ui_resources/`, `gen/`, `mta_archives/`, `app/cnma_approval_ui/dist/`). |
| `npm run predeploy` | Performs clean build & generates BTP Cloud Foundry deployment MTA archive (`.mtar`). |
