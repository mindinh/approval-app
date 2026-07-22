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
    const pathSegments = window.location.pathname.split('/');
    pathSegments.pop(); // Remove index.html or last filename if present
    const basePath = pathSegments.join('/') + '/';
    const absoluteIconUrl = new URL(`${basePath}apple-touch-icon.png`.replace(/\/+/g, '/'), window.location.origin).href;
    appleTouchIcon.setAttribute('href', absoluteIconUrl);
    console.log('[PWA] Resolved absolute apple-touch-icon URL:', absoluteIconUrl);
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

// Register Service Worker in production mode
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        // Resolve dynamic path relative to window.location.pathname context (handles subfolders in BTP)
        const pathSegments = window.location.pathname.split('/');
        pathSegments.pop(); // Remove index.html or last filename if present
        const basePath = pathSegments.join('/') + '/';
        const swPath = `${basePath}sw.js`.replace(/\/+/g, '/');

        navigator.serviceWorker.register(swPath)
            .then((registration) => {
                console.log('[PWA] Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('[PWA] Service Worker registration failed:', error);
            });
    });
}
