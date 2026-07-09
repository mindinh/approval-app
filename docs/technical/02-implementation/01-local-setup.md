# Local Development Setup Guide

This guide details the steps to set up, run, and test the **CNMA Approval** application locally on your workstation.

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
*   **Node.js**: Version 22 (LTS) is required (configured in `package.json` engines).
*   **Package Manager**: `npm` (bundled with Node.js).
*   **SAP CDS Development Kit**: Installed globally:
    ```bash
    npm install -g @sap/cds-dk
    ```
*   **Git**: For cloning the repository.

---

## 🛠️ Step-by-Step Installation

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url> cnma-approval
    cd cnma-approval
    ```

2.  **Install Root & Backend Dependencies**:
    At the root level of the project, run:
    ```bash
    npm install
    ```

3.  **Install Frontend UI Dependencies**:
    Navigate to the UI folder and install dependencies:
    ```bash
    cd app/cnma_approval_ui
    npm install
    cd ../..
    ```

4.  **Configure Environment Variables**:
    Create a `.env` file in the root directory. You can use the standard configurations needed to link with target destinations. For local mock development:
    ```env
    PORT=4005
    USE_MOCK_SAP=true
    ```

---

## 🚀 Running the Application

There are three primary ways to run the project locally depending on your connection status to SAP BTP.

### Option A: Fully Mocked Local Mode (Recommended for Offline Dev)
This mode runs the backend BFF with mock data suppliers, requiring no external network connectivity or BTP binding:
```bash
# Run both Backend & Frontend simultaneously:
npm run dev:all

# Or run separately:
npm run dev:be  # Starts BFF at http://localhost:4005
npm run dev:fe  # Starts React UI at http://localhost:5173
```

### Option B: Hybrid Profile Mode (Connects to SAP BTP Services)
This mode runs the backend locally but binds to deployed BTP destination and IAS/XSUAA authentication instances to query live data from Cloud Connector/S/4HANA:
1.  Ensure you have logged in via the CF CLI and targeted your space:
    ```bash
    cf login -a <api-endpoint> -o <org> -s <space>
    ```
2.  Bind services and run the hybrid command:
    ```bash
    npm run dev:hybrid
    ```

### Option C: LAN Sharing Mode (Mobile / Tablet Testing)
To test the mobile responsiveness on physical devices connected to the same Local Area Network:
```bash
# Share Mock Backend:
npm run start:lan

# Share Hybrid Connected Backend:
npm run start:hybrid:lan
```

---

## 🧪 Running Automated Tests

To validate functionality after making changes, run the test suites:

```bash
# Run backend and frontend unit tests:
npm run test

# Run tests with coverage reporting:
npm run test:coverage
```
All unit tests are run via **Vitest**.
