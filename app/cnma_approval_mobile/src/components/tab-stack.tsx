import { Stack } from 'expo-router/stack';

/**
 * iOS 26 draws a "scroll edge effect" under the status bar (a tinted band ending in a hard line) on
 * screens without a header. The brand wash already runs edge to edge there, so the top effect is hidden.
 */
const NO_TOP_EDGE_EFFECT = { top: 'hidden', bottom: 'automatic', left: 'automatic', right: 'automatic' } as const;

/**
 * Native stack of one tab (Home, Inbox, Approved, Dashboard), used as each tab group's `_layout`. The tab
 * root draws its own in-content header (title + avatar); the task detail lives above the tabs.
 */
export function TabStack() {
    return <Stack screenOptions={{ headerShown: false, orientation: 'portrait', scrollEdgeEffects: NO_TOP_EDGE_EFFECT }} />;
}
