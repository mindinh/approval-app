# Technical Documentation

This directory contains technical documentation for developers, system architects, and DevOps engineers maintaining or extending the **CNMA Approval** application.

> **Last Updated:** 2026-10-20

## 📂 Subdirectories

### 🏛️ 1. Architecture (`docs/technical/01-architecture/`)
Deep dives into system design, security, and infrastructure:
*   [**01-Overview**](01-architecture/01-overview.md): High-level system architecture, technology stack, and detail retrieval flows.
*   [**02-Authentication & Security**](01-architecture/02-auth-security.md): BTP SSO configuration, XSUAA, IAS, and Principal Propagation to S/4HANA.
*   [**03-Caching Strategy**](01-architecture/03-caching-strategy.md): In-memory cache design to handle API request performance optimizations.
*   [**04-Config-Driven Mapping**](01-architecture/04-config-driven-mapping.md): Raw OData transfer, frontend field catalogs and layout evaluation.

### ⚙️ 2. Implementation (`docs/technical/02-implementation/`)
Developer setup, project guides, and layouts:
*   [**01-Local Setup**](02-implementation/01-local-setup.md): Getting started, config variables, and hybrid profiles.
*   [**02-Project Structure**](02-implementation/02-project-structure.md): Codebase organization and mapping of directories.
*   [**03-Backend BFF Endpoints**](02-implementation/03-backend-bff-endpoints.md): Full listing of Express REST APIs provided by the CAP BFF.
*   [**04-Frontend Components**](02-implementation/04-frontend-components.md): Component structure, layouts, dynamic section registries, and routing.
*   [**05-Field Mapping Guide**](02-implementation/05-field-mapping-guide.md): 6-layer pipeline guide for developers & AI agents adding, modifying, or fixing fields.
*   [**06-Data Retrieval & Display Report**](02-implementation/06-data-retrieval-and-display-report.md): Architectural report & reference matrix for data retrieval, mapping, and display across all object types (`PO`, `PR`, `CLAIM`, `RE`).

### 📚 4. Reference (`docs/technical/04-reference/`)
Reference guides and specifications:
*   [**01-Configuration**](04-reference/01-configuration.md): Runtime environment readers, connection modes, service paths and renderer contracts.
*   [**02-Swagger / OpenAPI**](04-reference/02-swagger-api-placeholder.md): Implemented Swagger UI, source annotations and route verification.

## Configuration audit and validation

- [Unused URL/env audit](04-reference/03-unused-configuration-audit.md)
- Run `node scripts/check-doc-links.cjs` from the repository root to validate local documentation file links.
