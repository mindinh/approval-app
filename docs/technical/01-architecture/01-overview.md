# System Architecture Overview

> **Owner:** Enterprise Solution Architect | **Last Updated:** 2026-07-17 | **Status:** Active

This document provides a high-level technical overview of the **CNMA Approval** system design, integration boundaries, and technology stack.

---

## 🏛️ System Architecture Topology

The application is built as a decoupled Multi-Target Application (MTA) deployed on **SAP Business Technology Platform (BTP)**. It follows the Backend-For-Frontend (BFF) pattern:

```mermaid
graph TD
    subgraph ClientSide [Client Browser]
        ReactUI["Vite React Frontend<br/>(TypeScript / @cnma/react-ui)"]
    end

    subgraph SAPBTP [SAP BTP Cloud Foundry Environment]
        AppRouter["SAP Approuter<br/>(JWT Routing & SSO)"]
        BFF["CAP Node.js BFF Service<br/>(Express Middleware / @sap/cds)"]
        Cache["In-memory Cache<br/>(Node Cache wrapper)"]
    end

    subgraph SAPCore [Enterprise On-Premises Core]
        TaskGW["SAP Task Gateway<br/>(/iwfnd/sgw_taskprocessing)"]
        S4Core["S/4HANA OData Core<br/>(Unified V4 Service - zsb_prorequest)"]
    end

    ClientSide -->|HTTPS / JWT Auth| AppRouter
    AppRouter -->|JWT Principal Propagation| BFF
    BFF -->|Caching layer| Cache
    BFF -->|OData v2 Client Protocol| TaskGW
    BFF -->|OData v4 Client Protocol| S4Core
```

---

## 💻 Technology Stack

### Frontend Client
*   **Framework**: React 18+ powered by Vite (bundler and build system).
*   **Language**: TypeScript.
*   **Styling**: TailwindCSS & custom vanilla CSS for Fiori-inspired aesthetics.
*   **Data Fetching**: React Query (TanStack Query v5) for cache synchronization, stale-while-revalidate, and loading state management.
*   **State Management**: React Context APIs for theme settings, user profiles, and active lists.

### Backend BFF (Backend for Frontend)
*   **Framework**: SAP Cloud Application Programming Model (CAP) Node.js runtime (`@sap/cds`).
*   **Language**: TypeScript.
*   **Web Framework**: Embedded Express.js for routing custom REST APIs (instead of CDS OData).
*   **Integration SDK**: SAP Cloud SDK (`@sap-cloud-sdk/http-client`, `@sap-cloud-sdk/connectivity`) to perform destination lookups and authentication propagation.
*   **Authentication**: Passport.js with `@sap/xssec` for JWT token decoding and authorization checks.

### Datastores & Backends
*   **Task Lists**: SAP Task Gateway (supports workflow tasks, approvals, rejections).
*   **Procurement Records**: SAP S/4HANA ERP core exposing a unified OData v4 API (`/sap/opu/odata4/sap/zsb_prorequest/srvd_a2x/sap/zsd_prorequest/0001`) for PR and PO details, comments, and approval logs.

---

## 🔄 Detail Retrieval Flow (Strategy Pattern)

The system resolves detailed business object data using a Strategy Pattern. The [SapOdataAdapter](file:///d:/learning/test/cnma_approval/srv/lib/integrations/sap-odata-adapter.ts) acts as a facade, delegating requests to registered object strategies (such as [PrDetail](file:///d:/learning/test/cnma_approval/srv/lib/integrations/pr.ts) or [PoDetail](file:///d:/learning/test/cnma_approval/srv/lib/integrations/po.ts) implementing the [Detail](file:///d:/learning/test/cnma_approval/srv/lib/integrations/detail.ts) interface).

The sequence diagram below displays the end-to-end data retrieval flow:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client
    participant Processor as InboxProcessor
    participant Adapter as SapOdataAdapter
    participant Cache as TtlLruCache
    participant Strategy as Detail Strategy (PR/PO)
    participant ClientSDK as SapClient
    participant Meta as MetadataService

    Client->>Processor: GET /tasks/:id (with businessObjectType & instid)
    Processor->>Adapter: getDetail(objectType, objectId, sapUser, jwt, headerOnly)
    
    activate Adapter
    Adapter->>Cache: get(cacheKey)
    alt Cache Hit
        Cache-->>Adapter: Return cached detail object
    else Cache Miss
        Adapter->>Adapter: getStrategy(objectType)
        Adapter->>Strategy: getDetail(objectId, sapUser, jwt, headerOnly)
        activate Strategy
        
        Strategy->>ClientSDK: get(servicePath, endpoint, params, sapUser, jwt)
        ClientSDK-->>Strategy: Return raw OData JSON response
        
        Strategy->>Meta: normalizeDetail(rawEntity, path, sapUser, jwt)
        Meta-->>Strategy: Return normalized field values
        
        Strategy->>Strategy: Map custom properties & camelCase keys
        Strategy-->>Adapter: Return completed detail object
        deactivate Strategy
        
        Adapter->>Cache: set(cacheKey, detailObject)
    end
    Adapter-->>Processor: Return detail object
    deactivate Adapter
    
    Processor->>Client: Return aggregated task JSON response
```
