import { createRoot } from 'react-dom/client'

import './i18n'; // Initialize i18n before rendering
import './styles/index.css'
import App from './App.tsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import { FioriThemeProvider } from './contexts/FioriThemeContext.tsx'
import { ErrorProvider } from './contexts/ErrorProvider.tsx'
import { initFLPMessageListener } from './hooks/useFLPSync'
import { SessionTimeoutProvider } from './components/providers/SessionTimeoutProvider.tsx'

import { ErrorBoundary } from './components/common/ErrorBoundary'

// Initialize FLP message listener for iframe communication
initFLPMessageListener();

// Resolve and update apple-touch-icon link to a fully qualified absolute URL.
// This is critical for iOS Safari to successfully fetch the icon without relative path/subpath issues.
const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
if (appleTouchIcon) {
    const absoluteIconUrl = new URL(appleTouchIcon.getAttribute('href') || './sap-apple-touch-icon-v3.png', document.baseURI).href;
    appleTouchIcon.setAttribute('href', absoluteIconUrl);
}

createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
            <FioriThemeProvider>
                <ErrorProvider>
                    <SessionTimeoutProvider>
                        <App />
                    </SessionTimeoutProvider>
                </ErrorProvider>
            </FioriThemeProvider>
        </QueryClientProvider>
    </ErrorBoundary>
)

// Service worker updates and pre-React recovery live in public/startup.js.
