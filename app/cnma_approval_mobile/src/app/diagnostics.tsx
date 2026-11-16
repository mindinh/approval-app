import { config } from '@/lib/config/env';
import { ConnectionTestScreen } from '@/screens/connection-test';

export default function DiagnosticsRoute() {
    // The root layout only renders routes when config is present.
    return config ? <ConnectionTestScreen config={config} /> : null;
}
