# CNMA Approval Mobile (Expo)

Expo SDK 58 · React Native 0.88 · Expo Router · TanStack Query · TypeScript. Architecture: [docs/technical/03-mobile](../../docs/technical/03-mobile/01-mobile-architecture-guide.md).

Current scope (BA test build):

| Screen | What it shows |
|---|---|
| **Sign in** | Microsoft Entra ID sign-in (Authorization Code + PKCE). The session is restored on the next launch. |
| **Home** | Greeting, KPI counters (Pending · Completed · Total) and the **5 newest open tasks** (pull down to refresh). Task cards use the same renderers as the web app, so ids, chips and amounts match. |
| **Profile** (avatar in the Home header, opens as a bottom sheet) | Name and email, SAP user, session, app version and server, sign out. |

Bottom tabs: Home · Inbox · Approved · Dashboard (Inbox shows the pending count as a badge).

| **Inbox / Approved** | Search, category chips with counts (All · Purchase Req. · Purchase Order · Claim · Reservation), infinite list of task cards (same fields as the web card), pull to refresh. |
|---|---|
| **Task detail** (tap a card; long-press on iOS for a preview) | Header (type, document id, title, status, CC, creator), then Overview · Details (expandable line items) · Workflow (approval timeline) · Attachments · Comments. |

Not in this build yet: approve / reject (decision sheet), opening attachments, adding comments, Dashboard (placeholder).

```text
src/
├── app/                      # routes only: _layout (auth gate), (tabs)/ NativeTabs + shared tab stack, account (sheet), tasks/[id], reference-pr/[number] (read-only PR from a PO line), sign-in, auth
├── screens/                  # screen bodies + their private parts
│   ├── home/                 # summary-header, kpi-row, latest-tasks-section, task-row, task-summary (pure)
│   ├── account/              # profile-header, sap-account-section
│   ├── sign-in/
│   └── config-missing/
├── components/               # shared UI: Button, Section, ListRow, InfoRow, Skeleton, InlineError, Avatar…
├── hooks/                    # use-bff-api, queries/ (TanStack Query hooks + query keys)
├── lib/                      # infrastructure, no UI: config, auth (Entra session), api (fetch + typed endpoints), query
└── theme/                    # semantic colors, brand pairs, spacing, radius, type ramp, motion
```

Shared with the web app ("approval-core", alias in `tsconfig.json` + `metro.config.js`): `@approval-core/renderers` and `@approval-core/inbox-types` from `app/cnma_approval_ui/src`.

## Optional features

| Variable | Default | Effect |
|---|---|---|
| `EXPO_PUBLIC_ENABLE_MENTIONS` | off | `true` turns on tagging people (CC) in comments. It lists the SAP user directory (names, e-mails) and SAP e-mails the tagged people, so leave it off for store review and TestFlight builds (EAS environment `preview` / `production`). |

## Quick start

One-time: `cp .env.example .env.local` and fill in tenant id, client id and API scope (the API URL is set by the scripts).

Start the BFF first, from the repo root:

```bash
npm run dev:be:watch
```

### 1. Android emulator

```bash
npm run dev:emulator
```

- Boots the first Android Virtual Device if none is running (pick one with `-- --avd <name>`).
- Runs `adb reverse` for ports 8081 (Metro) and 4005 (BFF).
- Starts Metro with `--localhost` and opens Expo Go on the emulator.
- The API URL is `http://localhost:4005/...` and the Entra redirect URI is always **`exp://127.0.0.1:8081/--/auth`**, whatever Wi-Fi you are on.

### 2. Phone with Expo Go (iPhone or Android)

```bash
npm run dev:expo-go
```

- Detects the PC's Wi-Fi/LAN IP (override with `-- --host 192.168.1.20`).
- Metro advertises that IP, and the API URL becomes `http://<ip>:4005/...`.
- It prints the redirect URI to register in Entra: **`exp://<ip>:8081/--/auth`**. Reserve a fixed IP for the PC on the router so the URI stays the same.
- Scan the QR code: iPhone with the Camera app, Android with Expo Go. Expo Go must support SDK 58.
- The phone and PC must be on the same Wi-Fi, without client isolation (guest networks usually block it). Allow inbound TCP 8081 and 4005 in Windows Firewall (Private network).

Both scripts check that the BFF answers and print a summary (target, BFF URL, redirect URI). Add `-- --clear` to reset the Metro cache.

## Entra app registration (once)

1. **Authentication → Mobile and desktop applications**: add the redirect URIs above (`exp://127.0.0.1:8081/--/auth`, `exp://<ip>:8081/--/auth`). Do not use the "Single-page application" platform.
2. **API permissions**: the API app's `access_as_user` scope, with admin consent.
3. API app manifest: `"requestedAccessTokenVersion": 2`, so the token carries `preferred_username`.

## BA test checklist

| Step | Expected |
|---|---|
| Open the app the first time | Sign-in screen → Microsoft login → Home |
| Home | Greeting with your name, 3 counters, up to 5 newest tasks (type · id, title, vendor/type chips, requester, amount, age; red "Overdue" after 5 days) |
| Pull down on Home | Counters and tasks reload |
| Stop the BFF and pull down | Old data stays, with "Could not refresh tasks" and Retry |
| Tap the avatar (top right) | Profile bottom sheet (drag up for full height, swipe down or Done to close): name, email, SAP user, token time, version, server |
| Close and reopen the app | Goes straight to Home (still signed in) |
| Profile → Sign out → confirm | Back to the sign-in screen; reopening the app asks to sign in |

Locally the BFF calls SAP with its technical user, so "SAP user" shows that user. Your own SAP user appears only when the BFF runs on BTP with principal propagation.

## Commands

```bash
npm run typecheck     # tsc --noEmit
npx expo lint         # ESLint
npx expo-doctor       # dependency / config checks
npx expo install <pkg>  # always use this to add packages
```
