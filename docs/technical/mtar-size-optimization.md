# MTAR packaging and unused frontend code

The inspected `mta_archives/cnma_prorequest_s4h_1.0.0.mtar` was 5,750,563 bytes. Its approuter contained both the extracted frontend and `resources/cnma/cnma_approval_ui.zip` (1,891,691 bytes). The UI deployer also contained that ZIP, as required for HTML5 Application Repository / Work Zone.

The approuter build now ignores only `resources/cnma/cnma_approval_ui.zip`. It retains `index.html`, assets, startup recovery, the worker, and UI5 launch artifacts for standalone access. The deployer ZIP remains unchanged in purpose. Excluding the nested ZIP is expected to save about 1.89 MB; this is an estimate from the existing archive, not a rebuilt MTAR measurement.

Attachment preview routing supports images, PDF, and text. Word, Excel, and PowerPoint already use the download fallback. The unreachable `DocxViewer`, `ExcelViewer`, and generic Office viewer code, plus `docx-preview`, `xlsx`, and `@cyntler/react-doc-viewer`, have been removed. Rendering no longer imports the Office engine at module load. Regression tests exercise the actual preview card and preserve PDF/image preview and Office downloads.

Unused direct dependency declarations were removed from the frontend manifest. Packages needed internally by `@cnma/react-ui` remain managed by that library. The app explicitly retains `radix-ui`, `@radix-ui/react-aspect-ratio`, and `recharts`: the published library imports these but declares them only as development dependencies. Dashboard charts still use `recharts` directly.

Seven public assets with no code, configuration, or generator references were removed: `APP_ICON.png`, `icons.svg`, `images.jpg`, `proconarum-logo.png`, `RESOURCE_LOGO_FOOTER.png`, `pwa-icon-original.png`, and `vietjet-air-logo-jGY9c8Zn.jpg`. Active SAP icons, the SAP logo source, legacy install icons, UI5 metadata/component, branding currently used by the layout, fonts, and recovery bundles remain.

No frontend or MTAR build was run for this optimization, per the requested review-first boundary. Existing `dist`, router resources, and MTAR files therefore still contain the old assets. After approval to rebuild, use the clean build workflow and inspect the actual archive: the approuter should retain `resources/cnma/index.html` and its referenced assets, contain no frontend ZIP, and the UI deployer should retain its frontend ZIP. Measure both archive sizes before reporting a verified reduction.
