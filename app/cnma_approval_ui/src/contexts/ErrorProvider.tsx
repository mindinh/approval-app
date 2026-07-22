import React, { useState, useCallback } from 'react';
import { parseError, type AppError } from '@/utils/parseError';
import { ErrorModal } from '@/components/common/ErrorModal';
import { ErrorContext, type ShowErrorOptions } from './ErrorContextTypes';

export function ErrorProvider({ children }: { children: React.ReactNode }) {
    const [modalState, setModalState] = useState<{
        open: boolean;
        error: AppError | null;
        onRetry?: () => void;
        onClose?: () => void;
    }>({
        open: false,
        error: null,
    });

    const showError = useCallback((error: unknown, options?: ShowErrorOptions) => {
        const parsed = parseError(error);
        if (options?.title) {
            parsed.title = options.title;
        }
        setModalState({
            open: true,
            error: parsed,
            onRetry: options?.onRetry,
            onClose: options?.onClose,
        });
    }, []);

    const hideError = useCallback(() => {
        setModalState((prev) => {
            if (prev.onClose) {
                try {
                    prev.onClose();
                } catch (e) {
                    console.error('[ErrorProvider] Error executing onClose callback:', e);
                }
            }
            return { ...prev, open: false };
        });
    }, []);

    return (
        <ErrorContext.Provider value={{ showError, hideError }}>
            {children}
            <ErrorModal
                open={modalState.open}
                error={modalState.error}
                onClose={hideError}
                onRetry={modalState.onRetry}
            />
        </ErrorContext.Provider>
    );
}
