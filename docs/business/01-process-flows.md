# Business Process Flows

> **Owner:** Lead Business Analyst | **Last Updated:** 2026-08-05 | **Status:** Active

This document maps out the operational and lifecycle processes governing the **CNMA Approval** portal. The diagrams below illustrate how data flows and how actions transition across system boundaries for all supported business object types: **Purchase Requisitions (PR)**, **Purchase Orders (PO)**, **Expense Claims (CLAIM)**, and **Material Reservations (RE)**.

---

## 1. End-to-End User Journey Flow

The sequence diagram below outlines a business user's journey through the unified approval interface, from logging into the portal to completing an approval decision on a task:

```mermaid
sequenceDiagram
    actor Approver as Business Approver
    participant Portal as CNMA Approval UI
    participant BFF as Backend BFF (BTP)
    participant ERP as SAP S/4HANA Core

    Approver->>Portal: Log into workspace
    Portal->>BFF: Request active worklist
    BFF->>ERP: Fetch pending instances across PR, PO, Claim, & Reservation
    ERP-->>BFF: Return raw task data
    BFF-->>Portal: Deliver unified active task queue
    Portal-->>Approver: Display Dashboard with metric badges

    Approver->>Portal: Select a task card
    Portal->>BFF: Request complete task context & details
    BFF->>ERP: Query document detail, line items, attachments, & workflow status
    ERP-->>BFF: Return full detail structures
    BFF-->>Portal: Deliver consolidated details, comment timeline, & file list
    Portal-->>Approver: Render split-screen details panel

    alt Read Attachment
        Approver->>Portal: Click on attachment preview
        Portal->>BFF: Stream attachment binary content
        BFF->>ERP: Request file contents from SAP server
        ERP-->>BFF: Send file content
        BFF-->>Portal: Display embedded PDF / Image
    else Post Comment
        Approver->>Portal: Type note and click Submit
        Portal->>BFF: Post comment message
        BFF->>ERP: Sync comment to ERP document notes
        ERP-->>BFF: Acknowledge comment persistence
        BFF-->>Portal: Refresh timeline with new note
    end

    Approver->>Portal: Select Approve or Reject
    Portal->>BFF: Submit decision (with justification comment)
    BFF->>ERP: Push decision code (A for Approve, R for Reject) & comment note
    ERP-->>BFF: Confirm workflow level execution & note persistence
    BFF-->>Portal: Deliver success confirmation
    Portal-->>Approver: Remove task from active queue & update counters
```

---

## 2. Decision-Making Lifecycle Flow

This flowchart maps the lifecycle states of a workflow task and the path to final completion:

```mermaid
flowchart TD
    Start([Task Created in ERP: PR / PO / Claim / Reservation]) --> Sync[Aggregated in BTP Active Queue]
    Sync --> StateReady{State: IN_PROCESSING}
    
    StateReady -->|Approver opens task| Review[Review Details, Line Items & Attachments]
    
    Review --> ActionSelected{Decision Action}
    
    ActionSelected -->|Approve| ConfirmApprove[Approve Task]
    ActionSelected -->|Reject| CommentCheck{Requires Comment?}
    
    CommentCheck -->|Yes| InputComment[Approver Inputs Justification]
    InputComment --> ConfirmReject[Reject Task]
    
    ConfirmApprove --> PostERP[Post Decision to SAP Task Gateway]
    ConfirmReject --> PostERP
    
    PostERP --> ERPValidation{ERP Accepts Decision?}
    
    ERPValidation -->|Yes| MoveHistory[Move Task to Completed Queue]
    MoveHistory --> FinalState([State: COMPLETED])
    
    ERPValidation -->|No| ErrorState[Error Logged in Portal]
    ErrorState --> Review
```

---

## 3. Collaboration & Synchronization Flow

Comments and attachments are synced directly back to S/4HANA to maintain audit integrity across procurement and financial documents:

```mermaid
flowchart LR
    subgraph UI [User Interface]
        CommentInput[Input Comment]
        FileInput[Upload Attachment File]
    end

    subgraph BFF [BTP BFF Server]
        AuthCheck{Verify Scope}
        Parser[Format / Read Stream]
    end

    subgraph ERP [SAP S/4HANA ERP Core]
        GOS[Generic Object Services]
        Notes[ERP Document Notes: PR / PO / Claim / Reservation]
    end

    CommentInput -->|POST request| AuthCheck
    FileInput -->|POST raw stream| AuthCheck

    AuthCheck -->|Valid| Parser
    
    Parser -->|AddComment| Notes
    Parser -->|UploadAttachment| GOS
    
    Notes -->|Sync Acknowledged| UI
    GOS -->|Sync Acknowledged| UI
```
