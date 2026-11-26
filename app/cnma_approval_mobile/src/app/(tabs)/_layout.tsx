import { NativeTabs } from 'expo-router/native-tabs';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { FloatingTabButton, TabBarInsetProvider, useFloatingTabBarLayout, useFloatingTabBarStyle } from '@/components/floating-tab-bar';
import { TABS, badgeText } from '@/constants/tabs';
import { useStatusCounts } from '@/hooks/queries/use-task-queries';
import { useColors } from '@/theme';

const IS_IOS = process.env.EXPO_OS === 'ios';

/** iOS: the system tab bar (liquid glass on iOS 26+). The app ships iPhone-only (no supportsTablet). */
function IosTabs({ inboxBadge }: { inboxBadge: string | null }) {
    const colors = useColors();
    return (
        <NativeTabs tintColor={colors.accent}>
            {TABS.map((tab) => (
                <NativeTabs.Trigger key={tab.name} name={tab.name}>
                    <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} />
                    <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
                    {tab.name === '(inbox)' && inboxBadge ? <NativeTabs.Trigger.Badge>{inboxBadge}</NativeTabs.Trigger.Badge> : null}
                </NativeTabs.Trigger>
            ))}
        </NativeTabs>
    );
}

/** Android: a floating rounded bar hovering above the content (Material bottom navigation looks dated here). */
function FloatingTabs({ inboxBadge }: { inboxBadge: string | null }) {
    const barStyle = useFloatingTabBarStyle();
    const { contentInset } = useFloatingTabBarLayout();
    return (
        <TabBarInsetProvider value={contentInset}>
            <Tabs>
                <TabSlot />
                <TabList style={barStyle}>
                    {TABS.map((tab) => (
                        <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
                            <FloatingTabButton label={tab.label} icon={tab.icon} activeIcon={tab.activeIcon} badge={tab.name === '(inbox)' ? inboxBadge : null} />
                        </TabTrigger>
                    ))}
                </TabList>
            </Tabs>
        </TabBarInsetProvider>
    );
}

/** Top-level destinations; the Inbox badge is the number of requests waiting for approval. */
export default function TabsLayout() {
    const inboxBadge = badgeText(useStatusCounts().data?.inApproval);
    return IS_IOS ? <IosTabs inboxBadge={inboxBadge} /> : <FloatingTabs inboxBadge={inboxBadge} />;
}

/** A crash in any tab screen shows the friendly error panel (Try again / Send details to IT). */
export { CrashScreen as ErrorBoundary } from '@/components/crash-screen';
