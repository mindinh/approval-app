# System Architecture Overview

> **Owner:** Enterprise Solution Architect | **Last Updated:** 2026-08-27 | **Status:** Active

This document provides a high-level technical overview of the **CNMA Approval** system design, integration boundaries, technology stack, and business object transformation architecture.

---

## 🏛️ System Architecture Topology

The application is built as a decoupled Multi-Target Application (MTA) deployed on **SAP Business Technology Platform (BTP)**. It follows the Backend-For-Frontend (BFF) pattern powered by a **Config-Driven Mapping Engine**:

```mermaid
graph TD
    subgraph ClientSide [Client Browser]
        ReactUI["Vite React Frontend<br/>(TypeScript / @cnma/react-ui)"]
    end

    subgraph SAPBTP [SAP BTP Cloud Foundry Environment]
        AppRouter["SAP Approuter<br/>(JWT Routing & SSO)"]
        
        subgraph BFFService [CAP Node.js BFF Service]
            Express["Express Controllers<br/>(inbox-controller.ts)"]
            
            subgraph ActionPipeline [Decision & Validation Layer]
                Val["RequestValidator<br/>(request-validator.ts)"]
                DecStrat["DecisionStrategy Engine<br/>(decision-strategy.ts)"]
            end

            Proc["Inbox Processor<br/>(inbox-processor.ts)"]
            
            subgraph MappingEngine [Config-Driven Mapping Engine]
                Reg["ConfigRegistry<br/>(srv/configuration/object-types)"]
                Engine["MappingEngine & Transforms"]
                Resolver["FieldRequirementResolver"]
                Projector["CanonicalProjector"]
            end
            
            Adapters["SAP OData Adapters<br/>(PR, PO, CLAIM, RE strategies)"]
            Cache["In-memory Cache<br/>(TtlLruCache wrapper)"]
        end
    end

    subgraph SAPCore [Enterprise On-Premises Core]
        TaskGW["SAP Task Gateway<br/>(/iwfnd/sgw_taskprocessing)"]
        S4Core["S/4HANA OData Core<br/>(za_cnma_prorequest)"]
    end

    ClientSide -->|HTTPS / REST API| AppRouter
    AppRouter -->|JWT Principal Propagation| Express
    Express --> Val
    Val --> DecStrat
    DecStrat --> Proc
    Proc --> Reg
    Proc --> Adapters
    Adapters -->|Caching layer| Cache
    Adapters -->|OData v2 Client Protocol| TaskGW
    Adapters -->|OData v4 Client Protocol| S4Core
    Proc --> Engine
    Engine --> Resolver
    Resolver --> Projector
```

---

## 💻 Technology Stack

### Frontend Client
*   **Framework**: React 18+ powered by Vite (bundler and build system).
*   **Language**: TypeScript.
*   **Styling**: TailwindCSS & custom vanilla CSS for Fiori-inspired aesthetics.
*   **Data Fetching**: React Query (TanStack Query v5) for cache synchronization, stale-while-revalidate, and loading state management.
*   **Dynamic UI**: Schema-driven rendering using `TaskDetailSections.registry.ts` guided by backend `uiSchema`.

### Backend BFF (Backend for Frontend)
*   **Framework**: SAP Cloud Application Programming Model (CAP) Node.js runtime (`@sap/cds`).
*   **Language**: TypeScript.
*   **Web Framework**: Embedded Express.js for routing custom REST APIs (instead of CDS OData).
*   **Mapping Architecture**: Modular, config-driven engine ([`srv/lib/mapping/`](file:///d:/learning/test/cnma_approval/srv/lib/mapping/)) with declarative JSON specifications per object type.
*   **Integration SDK**: SAP Cloud SDK (`@sap-cloud-sdk/http-client`, `@sap-cloud-sdk/connectivity`) to perform destination lookups and authentication propagation.
*   **Authentication**: Passport.js with `@sap/xssec` for JWT token decoding and authorization checks.

### Datastores & Backends
*   **Task Lists**: SAP Task Gateway (supports workflow tasks, approvals, rejections).
*   **Procurement & Financial Records**: SAP S/4HANA ERP core exposing OData services (`APPROVAL_SRV`) supporting multiple document types:
    *   **PR** (Purchase Requisitions - `BUS2105`)
    *   **PO** (Purchase Orders - `BUS2012`)
    *   **CLAIM** (Expense Claims - `BUS2081` / `CLAIM`)
    *   **RE** (Reservations - `BUS2013`)

---

## 🔄 Consolidated Detail Retrieval & Mapping Flow

The system resolves detailed business object data using a Strategy Pattern combined with the **Config-Driven Mapping Engine** ([04-config-driven-mapping.md](file:///d:/learning/test/cnma_approval/docs/technical/01-architecture/04-config-driven-mapping.md)).

```mermaid
sequenceDiagram
    autonumber
    actor Client as React UI
    participant Ctrl as InboxController
    participant Proc as InboxProcessor
    participant Reg as ConfigRegistry
    participant Adapter as SapOdataAdapter
    participant Cache as TtlLruCache
    participant Strategy as Detail Strategy (PR/PO/CLAIM/RE)
    participant MapEng as MappingEngine
    participant Res as FieldRequirementResolver
    participant Proj as CanonicalProjector

    Client->>Ctrl: GET /tasks/tasks/:id
    Ctrl->>Proc: getTaskDetail(id, sapUser, hints, userJwt)
    
    activate Proc
    Proc->>Reg: get(objectType)
    Reg-->>Proc: Return active config.json
    
    Proc->>Adapter: getDetail(objectType, documentId, sapUser, jwt)
    activate Adapter
    Adapter->>Cache: get(cacheKey)
    alt Cache Hit
        Cache-->>Adapter: Return cached raw entity
    else Cache Miss
        Adapter->>Strategy: getDetail(documentId, sapUser, jwt)
        Strategy-->>Adapter: Return raw OData response payload
        Adapter->>Cache: set(cacheKey, rawPayload)
    end
    Adapter-->>Proc: Return raw payload
    deactivate Adapter
    
    Proc->>MapEng: map(rawPayload, config)
    activate MapEng
    MapEng-->>Proc: Return CanonicalBusinessObject
    deactivate MapEng

    Proc->>Res: resolve('detail', config)
    Res-->>Proc: Return field plan
    
    Proc->>Proj: project(canonicalObject, plan)
    Proj-->>Proc: Return projected canonical object
    
    Proc-->>Ctrl: Return consolidated task payload
    deactivate Proc
    Ctrl-->>Client: Return JSON response
```

For detailed specifications on the mapping engine architecture, configuration schemas, and hot-reloading mechanisms, refer to [Config-Driven Mapping Architecture](file:///d:/learning/test/cnma_approval/docs/technical/01-architecture/04-config-driven-mapping.md).
