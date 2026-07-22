import { createContext } from 'react';
import type { AppError } from '@/utils/parseError';

export interface ShowErrorOptions {
    title?: string;
    onRetry?: () => void;
    onClose?: () => void;
}

export interface ErrorContextType {
    showError: (error: unknown, options?: ShowErrorOptions) => void;
    hideError: () => void;
}

export const ErrorContext = createContext<ErrorContextType | undefined>(undefined);
