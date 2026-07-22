import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: (failureCount, error: any) => {
                // Instantly fail on any HTTP error (4xx/5xx) or SAP gateway error without making slow duplicate retries
                const status = error?.response?.status;
                if (status && status >= 400) return false;
                if (error?.message?.includes('SAP business/gateway error')) return false;
                if ((error as any)?.isForbidden || (error as any)?.isSapUserMappingMissing) return false;
                return failureCount < 1;
            },
            refetchOnWindowFocus: false,
        },
    },
});
