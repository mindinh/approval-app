import type { SymbolViewProps } from 'expo-symbols';
import { EmptyState } from '@/components/empty-state';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { useColors } from '@/theme';

/** Placeholder for a tab that is planned but not built yet: the tab title and a short note. */
export function ComingSoonScreen({ screenTitle, icon, title, message }: { screenTitle: string; icon: SymbolViewProps['name']; title: string; message: string }) {
    const colors = useColors();
    return (
        <ScreenScrollView headerless wash>
            <ScreenHeader title={screenTitle} />
            <EmptyState icon={icon} tint={{ foreground: colors.accent, background: colors.accentSoft }} title={title} message={message} />
        </ScreenScrollView>
    );
}
