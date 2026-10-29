# Mobile startup recovery

The startup watchdog runs before the application entry point. On a script/style failure or a 20-second startup timeout, it loads an independently compiled recovery entry. This entry renders the same `StatusDialog` used by session timeout, using `@cnma/react-ui` alert-dialog components, theme tokens, and the `startupRecovery` locale keys. Session text uses `sessionTimeout` keys. There is no hand-built HTML dialog or duplicate translation catalog in the watchdog.

The Vite build plugin emits `startup-recovery.js` and `startup-recovery.css` separately from the application's hashed chunks. They are loaded only on failure. All regular Vite production builds include these artifacts. Recovery CSS consumes the shared theme without embedding web fonts. The recovery UI still requires its own script and stylesheet to be reachable; it cannot diagnose a failure before the approuter delivers the application HTML.

Both approuter configurations expose the recovery files and worker without authentication and with `no-store`. The standalone router also supports `/cnma/`. Only public recovery assets are exposed; API authentication is unchanged.

The worker caches only allowlisted build assets with matching content types and rejects redirected responses. HTML, API, login, logout, recovery, install icons, and the web manifest pass through to normal browser networking. Public install metadata uses `no-cache` so icon updates can revalidate. Activation retires legacy `prorequest-v2` caches. The reset action unregisters only the current app mount's worker and removes its scoped static cache plus legacy app caches; it preserves session cookies and unrelated application caches.

On mobile, users can retry or reset the app cache from the recovery dialog, then provide the displayed support code if the failure persists. These changes address reproduced startup/cache failure modes; they do not establish the cause of an individual production user's login issue.

## Source layout and shared styles

Recovery follows the existing project directories. `src/startupRecovery.tsx` is the independent entry beside `main.tsx`; `components/common/StartupRecoveryDialog.tsx` contains the dialog; `utils/pwa.ts` owns cache reset. The pre-React watchdog stays in `public/startup.js`, so its execution does not depend on the app bundle. There is no feature directory or `src/startup` folder.

`styles/status-dialog.css` is the single source of dialog layout, typography, icon sizing, and mobile button sizes for both recovery and session timeout. It uses Tailwind scale utilities and semantic theme tokens via `@apply`. Both `styles/index.css` and the independent `styles/startup-recovery.css` import it. The recovery stylesheet remains a separate entry so a failure loading the main application's CSS cannot hide the recovery dialog. Shared component overrides are outside Tailwind layers so the library's default utilities do not override them.

## Install icons

The old SAP source PNG contained 15,459 opaque light gray checkerboard pixels. These were image data, not transparency, and resizing copied the grid into mobile icons. The source now has a clean white background. General-purpose 192/512 PWA icons and the favicon use transparent `-v4.png` variants, derived by removing only white pixels connected to the canvas edge so the SAP lettering remains white. Both HTML entries reference the transparent favicon; the web manifest explicitly assigns the transparent icons `purpose: any`. Maskable and Apple touch icons retain opaque `-v3.png` artwork suitable for those install surfaces. The main entry resolves the Apple touch icon URL against the document base. Versioned URLs prevent reuse of previous favicon/general-purpose artwork.

Run `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-pwa-icons.ps1` after changing the source, then `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-pwa-icons.ps1`. The latter checks dimensions, expected alpha, preserved white lettering, absence of baked-in checkerboard pixels, and current entry-point references. The operating system may retain a previously installed app icon; removing and installing the shortcut again may be necessary after deployment. Native title-bar icon appearance is controlled by the installed browser/OS; transparent source validation does not verify a physical installed app.

## Validation

Run backend `npm test`, frontend `npm test`, and frontend `npm run typecheck` to check the full application configuration. A production build is a separate step; it has not been rerun for these source changes.

`node scripts/test-startup-browser.mjs <path-to-playwright>` validates the production artifact with local API fixtures: a deliberately broken app bundle, localized recovery dialog, cache reset, and successful retry at `/` and `/cnma/`. It also checks real worker caching. Default profiles use installed Chrome with Android and iPhone viewport emulation. Set `PWA_EXTRA_ENGINES=1` to include WebKit when installed; emulation does not replace physical iPhone/Safari testing.

Both HTML entry points, web manifest, UI5 metadata, and the runtime Apple icon fallback reference clean icons with versioned filenames. No production artifacts have been rebuilt for this change; source validation does not verify the icon served by a deployed QAS/PRD route.

Icon source artwork lives in `app/cnma_approval_ui/scripts/sap-logo.png` rather than `public`, so Vite does not copy it to deployment output. Unreferenced legacy `apple-touch-icon.png`, `pwa-icon-192.png`, `pwa-icon-512.png`, `favicon.svg`, `sla-happy.svg` and `sla-overdue.svg` have been removed along with their obsolete explicit route alternatives. Work Zone metadata, Component.js, translations, startup/recovery assets and current versioned install icons remain required.
