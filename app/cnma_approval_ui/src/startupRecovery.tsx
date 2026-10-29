import { createRoot } from 'react-dom/client';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';
import { StartupRecoveryDialog, type StartupFailure } from './components/common/StartupRecoveryDialog';
import './styles/startup-recovery.css';

// This entry is compiled separately: no dependency on the app's hashed chunks.
const host = document.getElementById('startup-recovery-root');
if (host) {
    const root = createRoot(host);
    const i18n = createInstance();
    void i18n.use(initReactI18next).init({
        lng: /^vi\b/i.test(navigator.language) ? 'vi' : 'en',
        fallbackLng: 'en',
        initImmediate: false,
        interpolation: { escapeValue: false },
        resources: {
            en: { translation: { startupRecovery: en.startupRecovery } },
            vi: { translation: { startupRecovery: vi.startupRecovery } },
        },
    });
    window.addEventListener('cnma:startup-error', (event) => {
        const { code, baseUrl } = (event as CustomEvent<StartupFailure>).detail;
        root.render(<I18nextProvider i18n={i18n}><StartupRecoveryDialog code={code} baseUrl={baseUrl} /></I18nextProvider>);
    });
    window.addEventListener('cnma:startup-ready', () => root.render(null));
}
