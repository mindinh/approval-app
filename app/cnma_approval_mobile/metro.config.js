// Metro must watch the web app's shared, UI-agnostic folders ("approval-core") imported via `@approval-core/*`.
// They only contain plain TypeScript (no React/DOM); see docs/technical/03-mobile/02-approval-core-refactor.md.
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const webSrc = path.resolve(__dirname, '../cnma_approval_ui/src');

const config = getDefaultConfig(__dirname);
config.watchFolders = [...(config.watchFolders ?? []), path.join(webSrc, 'renderers'), path.join(webSrc, 'services/inbox'), path.join(webSrc, 'pages/Inbox/utils')];

// Shared files only import types from the web app. A runtime import of a package there (e.g. react) would
// resolve from the web's node_modules (React 18) first: the ESLint rules and the approval-core guide forbid it.
// The mobile node_modules stays the fallback for anything the web folder does not have.
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];

module.exports = config;
