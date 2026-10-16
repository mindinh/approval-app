# PWA icon verification — 2026-10-13

The app's production build exposes SAP install icons generated from
`app/cnma_approval_ui/public/sap-logo.png`. This verifies the app opened directly.
It does not verify installation of the surrounding SAP Build Work Zone site.

## Automated browser results

All 36 cases passed: four engines, three viewport/user-agent profiles, and three
URL prefixes per profile.

| Browser/engine | Desktop | Android profile | iPhone profile |
| --- | --- | --- | --- |
| Installed Google Chrome | 3/3 | 3/3 | 3/3 |
| Installed Microsoft Edge | 3/3 | 3/3 | 3/3 |
| Playwright Firefox | 3/3 | 3/3 | 3/3 |
| Playwright WebKit | 3/3 | 3/3 | 3/3 |

Prefixes tested: `/`, `/cnma/`, `/html5-apps/cnma/`. Each page was opened with a
task hash route (`index.html#/inbox/123`). Each test used a persistent browser
profile, rather than an incognito context.

Checks in each case:

- Manifest fetched successfully and `start_url` resolved to the app directory.
- Three manifest icons, the Apple touch icon and favicon returned PNG responses
  and decoded successfully inside the browser.
- Icon URLs referenced the SAP assets in the correct app directory.
- Service worker activated with the expected scope.
- Chrome and Edge reported no manifest or installability errors through CDP.

Firefox and WebKit tests validate fetching/decoding and service worker activation;
they do not expose the Chromium installability check. The mobile profiles emulate
viewport and user agent. They are **not real Android/iOS installation tests**;
Playwright WebKit on Windows is not Safari running on an iPhone or Mac.

Runner: `app/cnma_approval_ui/scripts/test-pwa-browser.mjs`.
Detailed results: `app/cnma_approval_ui/.pwa-test-results/report.json` (generated).
The runner requires Playwright, either installed locally or supplied as its first
argument. Set `PWA_EXTRA_ENGINES=1` to include Firefox and WebKit, and set
`PLAYWRIGHT_BROWSERS_PATH` to their installed browser directory if needed.
Keep browser downloads and profiles outside `dist` so they are not packaged
with the application; `.pwa-test-browsers` is an ignored directory for downloads.

## Work Zone boundary

`public/Component.js` embeds the React app in an iframe. When users install or
create a home-screen shortcut from the Work Zone URL, the top-level site owns the
document metadata and manifest used for installation. The iframe's manifest does
not become the Work Zone manifest.

Changing a tile image or header logo does not by itself verify an installed icon.
Cross-origin frames cannot edit the outer document. Even when same-origin access
is possible, runtime DOM edits are not a reliable cross-platform install contract
and can be replaced by the shell.

To use SAP for installation from Work Zone, inspect the actual site's top-level
favicon, Apple touch icon and web app manifest, then use the supported site-level
configuration available for its Work Zone edition. The actual site URL, edition
and administration access are still needed to determine the supported change.
Alternatively, install the app from its own direct HTTPS URL.

## Remaining acceptance checks

- Inspect the deployed HTTPS site and its authentication/redirect behavior,
  especially icon fetching without an authenticated browser session.
- Install on real iPhone/iPad Safari, Android Chrome and target desktop browsers;
  inspect the preview and resulting OS icon.
- Remove an older shortcut and install again to distinguish stored OS metadata
  from the current site metadata.
- Verify the Work Zone top-level page separately if that is the installation URL.

There is no claim of universal OS/browser compatibility from these local tests.
