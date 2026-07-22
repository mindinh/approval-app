import { useContext } from 'react';
import { ErrorContext, type ErrorContextType } from './ErrorContextTypes';

export function useErrorModal(): ErrorContextType {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error('useErrorModal must be used within an ErrorProvider');
    }
    return context;
}
