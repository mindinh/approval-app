import { ScreenScrollView } from '@/components/screen-scroll-view';
import type { AppConfig } from '@/lib/config/env';
import { EnvironmentSection } from './environment-section';
import { SapChecksSection } from './sap-checks-section';

/** Connection diagnostics: call the BFF (and through it, SAP) with the signed-in user's token. */
export function ConnectionTestScreen({ config }: { config: AppConfig }) {
    return (
        <ScreenScrollView>
            <SapChecksSection apiBaseUrl={config.apiBaseUrl} />
            <EnvironmentSection config={config} />
        </ScreenScrollView>
    );
}
