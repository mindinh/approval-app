# Cross-Platform PWA Email Link & Home Screen Shortcut Implementation Guide

> Goal: Convert the existing React web app into a cross-platform PWA-like “pseudo app” for **iOS and Android**, so users can install/add it to the Home Screen and open it like an app. Email links must still work reliably even when opened by Safari, Chrome, Gmail, Outlook, or an in-app browser instead of the installed PWA window.

---

## 1. Target behavior

### Expected user flow

```text
User receives email
  ↓
Clicks link: https://<APP_DOMAIN>/requests/<REQUEST_ID>
  ↓
Device/browser behavior:
  - iOS: opens in Safari / Gmail / Outlook / maybe standalone Home Screen web app
  - Android: opens in Chrome / Gmail / Outlook / maybe installed PWA
  ↓
SAP approuter checks login session
  ↓
If not logged in: redirect to IAS/XSUAA login
  ↓
After login: return to the same request/task URL
  ↓
React route opens the correct request/task detail page
```

### Important limitation

Do **not** rely on mobile OS behavior always opening the installed PWA from an email link.

Treat the installed PWA as a UX enhancement. The same URL must also work correctly in a normal browser tab or in-app browser.

Recommended email link format:

```text
https://<APP_DOMAIN>/requests/<REQUEST_ID>
https://<APP_DOMAIN>/tasks/<TASK_ID>
```

Avoid custom protocols for PWA-only web apps, such as:

```text
myapp://requests/REQ-10001
```

Custom protocols are more suitable for native apps or React Native apps, not plain PWA deployment.

---

## 2. Platform behavior summary

| Area | iOS / iPadOS | Android / Chrome |
|---|---|---|
| Install method | User manually uses Safari → Share → Add to Home Screen | Chrome can show install prompt; user can also use browser menu → Install app/Add to Home Screen |
| Install prompt from code | Limited / not reliable like Android | Supported through `beforeinstallprompt` on compatible Chromium browsers |
| Standalone app window | Supported after Add to Home Screen when configured correctly | Supported after installing PWA |
| Email link behavior | Often opens in Safari or in-app browser; may not open Home Screen web app | Often better than iOS, but Gmail/Outlook/in-app browsers can still intercept links |
| Best strategy | Always support browser fallback | Always support browser fallback |
| Deep link style | HTTPS route | HTTPS route |

---

## 3. References for agent

Use these as implementation references:

- MDN — Web app manifest overview:  
  https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest
- MDN — Making PWAs installable, including `beforeinstallprompt`:  
  https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- MDN — Manifest icons member:  
  https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons
- Chrome Developers — Installability requirements and `beforeinstallprompt`:  
  https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest
- Web.dev — Web app manifest:  
  https://web.dev/learn/pwa/web-app-manifest
- Apple — Configuring Web Applications for iOS Home Screen behavior:  
  https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
- WebKit — iOS/iPadOS Home Screen web app behavior with `display: standalone` / `fullscreen`:  
  https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/

---

## 4. Implementation scope

This guide assumes:

- Frontend: React web app.
- Deployment: SAP BTP approuter, HTML5 app, or static React build served by approuter.
- Auth: approuter + XSUAA or IAS integration.
- API route: usually `/api/...` forwarded by approuter to CAP service.
- Deep links: `/requests/:requestId`, `/tasks/:taskId`, or similar.

The implementation must include:

1. Web app manifest.
2. iOS-specific meta tags.
3. Android-friendly manifest fields.
4. App icons, including `apple-touch-icon` and maskable Android icons.
5. Service worker with safe caching.
6. React deep link routes.
7. SAP approuter fallback for client-side routing.
8. Login return URL preservation.
9. Install UI for Android.
10. Manual Add to Home Screen instruction for iOS.
11. iOS and Android test checklists.
12. Acceptance criteria.

---

## 5. Required file structure

Recommended structure:

```text
react-app/
├─ public/
│  ├─ index.html
│  ├─ manifest.webmanifest
│  ├─ sw.js
│  └─ icons/
│     ├─ icon-192.png
│     ├─ icon-512.png
│     ├─ apple-touch-icon.png
│     ├─ maskable-icon-192.png
│     └─ maskable-icon-512.png
├─ src/
│  ├─ main.tsx or index.tsx
│  ├─ App.tsx
│  ├─ routes/
│  │  └─ AppRoutes.tsx
│  ├─ components/
│  │  └─ PwaInstallBanner.tsx
│  └─ utils/
│     ├─ pwa.ts
│     └─ authRedirect.ts
```

Notes:

- For Vite, everything under `public/*` is copied directly to the build output.
- For Create React App, everything under `public/*` is also copied directly to the build output.
- For SAP HTML5 app deployment, verify that `manifest.webmanifest`, `sw.js`, and `/icons/*` are present in the final deployed artifact.

---

## 6. Add web app manifest

Create:

```text
public/manifest.webmanifest
```

Template:

```json
{
  "name": "VJ Request Management",
  "short_name": "VJ Requests",
  "description": "Request approval and workflow management app",
  "id": "/",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/maskable-icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/maskable-icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ]
}
```

### Manifest field notes

| Field | Purpose |
|---|---|
| `name` | Full app name shown during install |
| `short_name` | Short label shown under app icon |
| `id` | Stable app identity for installed PWA |
| `start_url` | URL opened when user taps app icon |
| `scope` | URL range treated as part of the app |
| `display` | `standalone` removes normal browser UI when installed |
| `background_color` | Splash/loading background color |
| `theme_color` | Browser/theme UI color on supported browsers |
| `icons` | Required app icons for install and launcher |
| `purpose: maskable` | Android launcher can crop icon safely |

### Important rule for `scope`

If your app is deployed at root:

```json
{
  "start_url": "/",
  "scope": "/"
}
```

If your app is deployed under a subpath:

```json
{
  "start_url": "/vj-requests/",
  "scope": "/vj-requests/"
}
```

Do not set `scope` too narrow, otherwise routes like `/requests/REQ-10001` may open outside the standalone app.

---

## 7. Add iOS and shared meta tags

Edit:

```text
public/index.html
```

Inside `<head>`, add:

```html
<link rel="manifest" href="/manifest.webmanifest" />

<meta name="theme-color" content="#ffffff" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

<!-- iOS Home Screen support -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="VJ Requests" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />

<!-- iOS Home Screen icon -->
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
```

### Status bar options for iOS

```html
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

Possible values:

```text
default
black
black-translucent
```

Recommendation: start with `default`. Use `black-translucent` only if the app layout handles safe areas properly.

---

## 8. Prepare app icons

Create folder:

```text
public/icons/
```

Required icons:

```text
public/icons/icon-192.png
public/icons/icon-512.png
public/icons/apple-touch-icon.png
public/icons/maskable-icon-192.png
public/icons/maskable-icon-512.png
```

Recommended sizes:

| File | Size | Purpose |
|---|---:|---|
| `apple-touch-icon.png` | 180x180 | iOS Home Screen icon |
| `icon-192.png` | 192x192 | General PWA icon |
| `icon-512.png` | 512x512 | General PWA icon / install prompt |
| `maskable-icon-192.png` | 192x192 | Android adaptive launcher icon |
| `maskable-icon-512.png` | 512x512 | Android adaptive launcher icon |

### Maskable icon requirement

For maskable icons, keep the important logo/content inside the safe center area. Android launchers may crop the icon into circle, squircle, rounded square, or other shapes.

Practical guideline:

```text
Canvas: 512x512
Important logo content: keep within center ~80% area
Background: fill the whole square
Avoid text near edges
```

---

## 9. Add service worker

A PWA should have a service worker. For business apps, cache carefully.

Main rule:

```text
Cache static app shell/assets.
Do NOT cache dynamic SAP/CAP API responses by default.
```

Create:

```text
public/sw.js
```

Template:

```js
const CACHE_NAME = "vj-request-app-v1";

const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/maskable-icon-192.png",
  "/icons/maskable-icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  // Never cache API calls to CAP/SAP through approuter.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/odata/") ||
    url.pathname.includes("/sap/opu/odata")
  ) {
    return;
  }

  // For navigation requests, prefer network first.
  // If offline, fallback to cached root app shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/"))
    );
    return;
  }

  // For static assets, use cache first.
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        const responseClone = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      });
    })
  );
});
```

### Register service worker

In:

```text
src/main.tsx
```

or:

```text
src/index.tsx
```

Add:

```ts
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });
  });
}
```

For Create React App, replace `import.meta.env.PROD` with:

```ts
process.env.NODE_ENV === "production"
```

CRA version:

```ts
if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });
  });
}
```

### Service worker HTTPS requirement

Service workers require a secure context:

```text
Allowed:
- https://<domain>
- http://localhost

Not allowed:
- http://normal-domain
```

SAP BTP deployed URLs are HTTPS, so production should be fine.

---

## 10. React routing for email deep links

Email links should point directly to route URLs.

Example:

```text
https://<APP_DOMAIN>/requests/REQ-10001
https://<APP_DOMAIN>/tasks/TASK-10001
```

React Router setup:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { RequestDetailPage } from "./pages/RequestDetailPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/requests/:requestId" element={<RequestDetailPage />} />
        <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

Example request detail page:

```tsx
import { useParams } from "react-router-dom";

export function RequestDetailPage() {
  const { requestId } = useParams();

  return (
    <main>
      <h1>Request Detail</h1>
      <p>Request ID: {requestId}</p>
    </main>
  );
}
```

---

## 11. SAP approuter fallback for React routes

Client-side routes must not return `404` when opened directly.

This URL must work:

```text
https://<APP_DOMAIN>/requests/REQ-10001
```

Not only this:

```text
https://<APP_DOMAIN>/
```

### Example `xs-app.json`

```json
{
  "welcomeFile": "/index.html",
  "authenticationMethod": "route",
  "routes": [
    {
      "source": "^/api/(.*)$",
      "target": "/$1",
      "destination": "srv-api",
      "authenticationType": "xsuaa"
    },
    {
      "source": "^/(.*\\.(?:js|css|png|jpg|jpeg|svg|ico|json|webmanifest|txt|woff|woff2|map))$",
      "target": "/$1",
      "localDir": "resources",
      "authenticationType": "xsuaa"
    },
    {
      "source": "^/(.*)$",
      "target": "/index.html",
      "localDir": "resources",
      "authenticationType": "xsuaa"
    }
  ]
}
```

### Notes

- `localDir` may be `resources`, `dist`, or `build` depending on the project structure.
- The API route must appear before the fallback route.
- Static assets should be served as files.
- Non-static frontend routes should fallback to `index.html`.

---

## 12. Preserve return URL after login

For approuter + XSUAA/IAS, the approuter usually handles login and redirects back to the original URL.

Still, verify this behavior with direct deep links:

```text
https://<APP_DOMAIN>/requests/REQ-10001
```

Expected flow:

```text
Open deep link while logged out
  ↓
Redirect to login
  ↓
Login success
  ↓
Return to /requests/REQ-10001
```

If the app has a custom login screen, use `returnUrl`.

Helper:

```ts
export function redirectToLoginWithReturnUrl() {
  const returnUrl = window.location.pathname + window.location.search;
  window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
}

export function getReturnUrlAfterLogin() {
  const params = new URLSearchParams(window.location.search);
  return params.get("returnUrl") || "/";
}
```

After login:

```ts
import { useNavigate } from "react-router-dom";
import { getReturnUrlAfterLogin } from "./utils/authRedirect";

function onLoginSuccess() {
  const navigate = useNavigate();
  navigate(getReturnUrlAfterLogin(), { replace: true });
}
```

---

## 13. Detect PWA / standalone mode

Create:

```text
src/utils/pwa.ts
```

```ts
export function isRunningStandalone(): boolean {
  const isStandaloneDisplayMode = window.matchMedia("(display-mode: standalone)").matches;
  const isIosStandalone = (window.navigator as any).standalone === true;

  return isStandaloneDisplayMode || isIosStandalone;
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function isAndroid(): boolean {
  return /android/i.test(window.navigator.userAgent);
}
```

---

## 14. Android install prompt

Android Chrome can fire `beforeinstallprompt` when the PWA is installable.

Create:

```text
src/components/PwaInstallBanner.tsx
```

```tsx
import { useEffect, useState } from "react";
import { isAndroid, isIos, isRunningStandalone } from "../utils/pwa";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (isRunningStandalone()) {
      return;
    }

    if (isIos()) {
      setShowIosGuide(true);
      return;
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    console.log("PWA install choice:", choice.outcome);
    setDeferredPrompt(null);
  }

  if (isRunningStandalone()) {
    return null;
  }

  if (deferredPrompt && isAndroid()) {
    return (
      <section className="pwa-install-banner">
        <p>Install this app for faster access.</p>
        <button type="button" onClick={handleInstallClick}>
          Install app
        </button>
      </section>
    );
  }

  if (showIosGuide) {
    return (
      <section className="pwa-install-banner">
        <p>To add this app to your iPhone Home Screen: Safari → Share → Add to Home Screen.</p>
      </section>
    );
  }

  return null;
}
```

Add it near the app root:

```tsx
import { PwaInstallBanner } from "./components/PwaInstallBanner";
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  return (
    <>
      <PwaInstallBanner />
      <AppRoutes />
    </>
  );
}
```

### UX note

For internal enterprise apps, keep the banner subtle. Do not block the user from using the app.

Recommended text:

```text
iOS: Open in Safari → Share → Add to Home Screen.
Android: Tap Install app for faster access.
```

---

## 15. Email link design

Use normal HTTPS links.

Example email body:

```text
A new approval task is waiting for you.

Open task:
https://<APP_DOMAIN>/tasks/<TASK_ID>
```

Recommended email link patterns:

```text
/requests/:requestId
/tasks/:taskId
/approvals/:approvalId
/material-requests/:requestId
/purchase-requests/:requestId
```

Avoid session-specific or temporary links unless required.

Bad:

```text
https://<APP_DOMAIN>/#temporaryState=abc123
https://<APP_DOMAIN>/requests/REQ-10001?sap-xapp-state=...
```

Good:

```text
https://<APP_DOMAIN>/requests/REQ-10001
```

If extra context is required, use stable query parameters:

```text
https://<APP_DOMAIN>/requests/REQ-10001?source=email
```

---

## 16. Handling Gmail / Outlook / in-app browsers

Gmail and Outlook may open links inside an in-app browser first.

The app must still work there.

Required behavior:

```text
Email app opens in-app browser
  ↓
App loads normally
  ↓
Login works
  ↓
Route /requests/:id works
  ↓
User can continue in browser or installed PWA
```

Do not depend on:

```text
Email app → installed PWA always opens
```

This is not guaranteed across iOS, Android, Gmail, Outlook, corporate MDM settings, or default browser settings.

---

## 17. Offline behavior recommendation

For SAP workflow/request apps, avoid full offline business behavior unless explicitly required.

Recommended offline behavior:

```text
App shell can load
Show "You are offline" message
Do not allow submit/approve/reject while offline
Do not show stale task list as fresh data
```

Example offline detector:

```tsx
import { useEffect, useState } from "react";

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
```

Usage:

```tsx
const online = useOnlineStatus();

if (!online) {
  return <p>You are offline. Please reconnect to continue.</p>;
}
```

---

## 18. Security and auth notes for SAP BTP

### Recommended pattern

```text
PWA / browser frontend
  ↓
SAP approuter session cookie
  ↓
Approuter forwards requests to CAP service
  ↓
CAP calls SAP backend / destination / workflow APIs
```

### Do not store access tokens in localStorage

Avoid:

```ts
localStorage.setItem("access_token", token);
```

Reason:

```text
Browser storage is exposed to XSS risk.
Approuter session/cookie-based auth is preferred for web apps.
```

### API calls from React

Use relative URLs:

```ts
const response = await fetch(`/api/requests/${requestId}`, {
  method: "GET",
  credentials: "include"
});
```

Do not hardcode CAP service URL in frontend:

```ts
// Avoid this
fetch("https://some-cap-srv.cfapps.../odata/v4/...");
```

Use approuter route:

```ts
fetch("/api/odata/v4/...");
```

---

## 19. Build and deployment checklist

Before deployment:

```text
[ ] public/manifest.webmanifest exists
[ ] public/sw.js exists
[ ] public/icons/icon-192.png exists
[ ] public/icons/icon-512.png exists
[ ] public/icons/apple-touch-icon.png exists
[ ] public/icons/maskable-icon-192.png exists
[ ] public/icons/maskable-icon-512.png exists
[ ] index.html links manifest
[ ] index.html has iOS meta tags
[ ] service worker is registered only in production
[ ] API routes are excluded from service worker cache
[ ] React Router has direct routes for email links
[ ] approuter has fallback to index.html
[ ] login returns user to original deep link
[ ] deployed app is HTTPS
```

After deployment:

```text
[ ] Open https://<APP_DOMAIN>/manifest.webmanifest directly
[ ] Open https://<APP_DOMAIN>/sw.js directly
[ ] Open https://<APP_DOMAIN>/icons/icon-192.png directly
[ ] Open https://<APP_DOMAIN>/requests/TEST directly
[ ] Refresh /requests/TEST and confirm no 404
[ ] Verify /api/... still calls CAP and is not served by React fallback
```

---

## 20. Chrome DevTools verification

Use desktop Chrome first.

Open:

```text
Chrome DevTools → Application
```

Check:

```text
Manifest:
[ ] name and short_name show correctly
[ ] start_url is correct
[ ] display is standalone
[ ] theme_color is correct
[ ] icons load correctly
[ ] maskable icons are detected

Service Workers:
[ ] sw.js is registered
[ ] status is activated and running
[ ] no repeated install errors

Cache Storage:
[ ] static assets cached
[ ] API responses are not cached unexpectedly

Lighthouse / PWA checks:
[ ] app is installable or close to installable
[ ] manifest is valid
[ ] service worker is available
```

---

## 21. iOS test checklist

Test devices/apps:

```text
[ ] iPhone Safari
[ ] Apple Mail
[ ] Gmail app on iPhone
[ ] Outlook app on iPhone
```

Test cases:

```text
1. Open https://<APP_DOMAIN> in Safari.
2. Use Share → Add to Home Screen.
3. Confirm app icon appears on Home Screen.
4. Tap Home Screen icon.
5. Confirm app opens without Safari address bar.
6. Confirm login works.
7. Confirm /requests/REQ-10001 opens correctly after login.
8. Open https://<APP_DOMAIN>/requests/REQ-10001 directly in Safari.
9. Refresh that deep link route.
10. Confirm no 404.
11. Send email containing https://<APP_DOMAIN>/requests/REQ-10001.
12. Tap link from Apple Mail.
13. Tap link from Gmail app.
14. Tap link from Outlook app.
15. Confirm route opens correctly even if it opens in Safari/in-app browser.
16. Log out and tap email link again.
17. Confirm login redirects back to the exact request URL.
18. Turn on airplane mode and open installed app.
19. Confirm app shell loads or shows a clean offline message.
20. Confirm approve/reject/submit actions are blocked offline.
```

Expected result:

```text
The installed Home Screen app works.
Email links also work even when iOS opens them in Safari or an in-app browser.
```

---

## 22. Android test checklist

Test devices/apps:

```text
[ ] Android Chrome
[ ] Gmail app on Android
[ ] Outlook app on Android
[ ] Samsung Internet if required by users
```

Test cases:

```text
1. Open https://<APP_DOMAIN> in Chrome.
2. Confirm install prompt appears or custom Install app button appears.
3. Tap Install app.
4. Confirm app icon appears in launcher.
5. Tap launcher icon.
6. Confirm app opens standalone without Chrome address bar.
7. Confirm login works.
8. Open https://<APP_DOMAIN>/requests/REQ-10001 directly in Chrome.
9. Refresh the deep link route.
10. Confirm no 404.
11. Send email containing https://<APP_DOMAIN>/requests/REQ-10001.
12. Tap link from Gmail app.
13. Tap link from Outlook app.
14. Confirm route opens correctly even if it opens in in-app browser.
15. Log out and tap email link again.
16. Confirm login redirects back to the exact request URL.
17. Turn off network and open installed app.
18. Confirm app shell loads or shows a clean offline message.
19. Confirm /api/... responses are not stale/cached.
20. Confirm approve/reject/submit actions are blocked offline.
```

Expected result:

```text
The app can be installed on Android.
The installed app opens standalone.
Email links work through Chrome/Gmail/Outlook fallback behavior.
```

---

## 23. Common issues and fixes

### Issue: manifest returns 404

Cause:

```text
manifest.webmanifest was not included in final build/deployment.
```

Fix:

```text
Ensure public/manifest.webmanifest exists before build.
Verify final deployed artifact contains manifest.webmanifest.
Open https://<APP_DOMAIN>/manifest.webmanifest directly.
```

---

### Issue: service worker does not register

Possible causes:

```text
App is not served over HTTPS.
sw.js missing in deployed artifact.
Registration path is wrong.
Browser cache has old service worker.
```

Fix:

```text
Open https://<APP_DOMAIN>/sw.js directly.
Check DevTools → Application → Service Workers.
Unregister old service worker during testing.
Hard refresh.
```

---

### Issue: direct deep link returns 404

Example failing URL:

```text
https://<APP_DOMAIN>/requests/REQ-10001
```

Cause:

```text
Server/approuter tries to find physical file /requests/REQ-10001.
React Router never loads.
```

Fix:

```text
Add approuter fallback route to index.html.
Make sure API routes are above fallback route.
```

---

### Issue: API calls return index.html

Cause:

```text
Fallback route catches /api/... before API route.
```

Fix:

```text
Put /api route before catch-all fallback.
```

Correct order:

```text
1. /api route
2. static asset route
3. React fallback route
```

---

### Issue: stale workflow/request data

Cause:

```text
Service worker caches API responses.
```

Fix:

```text
Exclude /api, /odata, and SAP backend paths from service worker cache.
Use network-first or no service-worker handling for API requests.
```

---

### Issue: Android install prompt does not appear

Possible causes:

```text
Manifest invalid.
Missing required icons.
Service worker not registered.
App not served over HTTPS.
Browser does not consider app installable yet.
User previously dismissed the prompt.
```

Fix:

```text
Check DevTools → Application → Manifest.
Check DevTools → Application → Service Workers.
Check Lighthouse PWA/installable warnings.
Use browser menu → Install app as fallback.
```

---

### Issue: iOS Add to Home Screen opens Safari UI

Possible causes:

```text
User is not launching from Home Screen icon.
Missing apple-mobile-web-app-capable meta tag.
Manifest display is not standalone/fullscreen.
Old Home Screen icon was added before config was updated.
```

Fix:

```text
Remove old Home Screen icon.
Clear Safari cache if needed.
Open site in Safari again.
Add to Home Screen again.
Launch from the new icon.
```

---

## 24. Acceptance criteria

The implementation is accepted when all conditions are met.

### General

```text
[ ] App has valid manifest.webmanifest.
[ ] App has working service worker.
[ ] App has iOS and Android icons.
[ ] App loads over HTTPS.
[ ] App works in normal browser.
[ ] App works when launched from installed/Home Screen icon.
[ ] App does not cache dynamic SAP/CAP API data incorrectly.
```

### Deep links

```text
[ ] /requests/:requestId opens directly.
[ ] /tasks/:taskId opens directly.
[ ] Refreshing a deep link does not return 404.
[ ] Logged-out deep link redirects to login.
[ ] After login, user returns to the same deep link.
```

### iOS

```text
[ ] User can Add to Home Screen from Safari.
[ ] Home Screen icon launches standalone web app.
[ ] Email links work from Apple Mail.
[ ] Email links work from Gmail app.
[ ] Email links work from Outlook app.
[ ] Browser fallback is acceptable when email link does not open standalone PWA.
```

### Android

```text
[ ] User can install app from Chrome.
[ ] Custom Install app button works when beforeinstallprompt is available.
[ ] Launcher icon opens standalone app.
[ ] Email links work from Gmail app.
[ ] Email links work from Outlook app.
[ ] Browser/in-app fallback is acceptable when email link does not open installed PWA.
```

---

## 25. Final implementation recommendation

Use one cross-platform HTTPS deep link strategy:

```text
https://<APP_DOMAIN>/requests/<REQUEST_ID>
https://<APP_DOMAIN>/tasks/<TASK_ID>
```

Then support all possible open contexts:

```text
Installed PWA on iOS
Installed PWA on Android
Safari browser
Chrome browser
Gmail in-app browser
Outlook in-app browser
```

The key rule:

```text
Never make the business flow depend on the OS opening the installed PWA.
Always make the URL itself fully functional.
```

For stronger guaranteed behavior like:

```text
Email link → native app opens → navigate to exact task
```

use a native app / React Native app with:

```text
iOS Universal Links
Android App Links
```

For this web/PWA implementation, normal HTTPS deep links plus robust browser fallback is the correct approach.
