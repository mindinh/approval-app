export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export function handleSapError(error: any): AppError {
    if (error.response) {
        // SAP Gateway / HTTP error responses
        const status = error.response.status;
        const data = error.response.data;
        const message = data?.error?.message?.value || data?.error?.message || error.message;
        
        if (status === 401 || status === 403) {
            return new AppError(`SAP authentication failure: ${message}`, status, 'SAP_AUTH_ERROR');
        }
        return new AppError(`SAP business/gateway error: ${message}`, status, 'SAP_BUSINESS_ERROR');
    }
    
    if (error.request) {
        // Connection error (no response received)
        return new AppError('Unable to connect to SAP system. Please check your connectivity / cloud connector.', 502, 'SAP_CONNECTIVITY_ERROR');
    }
    
    return new AppError(error.message || 'Unknown integration error', 500, 'UNKNOWN_ERROR');
}
