import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { reauthenticateSession, triggerSessionExpiredGlobal } from '@/components/providers/SessionTimeoutProvider';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 30000,
});

// CSRF Token cache
let csrfToken: string | null = null;
let tokenFetchPromise: Promise<string | null> | null = null;

/**
 * Fetch CSRF token from the server
 */
const fetchCsrfToken = async (): Promise<string | null> => {
  if (tokenFetchPromise) {
    return tokenFetchPromise;
  }

  tokenFetchPromise = (async () => {
    try {
      const response = await axios.get('api/cnma/APPROVAL_SRV/$metadata', {
        headers: {
          'X-CSRF-Token': 'Fetch',
        },
      });
      csrfToken = response.headers['x-csrf-token'];
      return csrfToken;
    } catch (error) {
      console.warn('CSRF token fetch failed:', (error as any)?.response?.status);
      csrfToken = null;
      return null;
    } finally {
      tokenFetchPromise = null;
    }
  })();

  return tokenFetchPromise;
};

/**
 * Request interceptor - adds CSRF token to non-GET requests
 */
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const method = config.method?.toLowerCase();

    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
      if (!csrfToken) {
        await fetchCsrfToken();
      }

      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - handles CSRF token expiration (403) and session expiration (401)
 */
let isHandlingSessionExpiry = false;

axiosInstance.interceptors.response.use(
  (response) => {
    // Detect if we expected JSON but got HTML (e.g. redirected to login page)
    const contentType = response.headers['content-type'] || '';
    const isHtmlResponse = typeof response.data === 'string' &&
      (response.data.includes('<!DOCTYPE html>') ||
        response.data.includes('<html') ||
        contentType.includes('text/html'));

    if (isHtmlResponse) {
      console.warn('[Session] Received HTML instead of JSON (likely redirected to login) -> attempting silent SSO re-auth or showing expired dialog.');

      const method = (response.config.method || 'get').toLowerCase();
      const isMeEndpoint = response.config.url?.endsWith('/me');
      const sessionActive = sessionStorage.getItem('session_active') === 'true';

      // Never redirect to /do/logout here — /do/logout triggers Single Logout (SLO)
      // on IAS & Azure Entra ID and destroys the user's SSO session.
      if (isMeEndpoint || !sessionActive || method === 'get') {
        if (!reauthenticateSession(false)) {
          triggerSessionExpiredGlobal();
        }
      } else {
        triggerSessionExpiredGlobal();
      }

      // Return a rejected promise with a simulated unauthorized error
      const error = new Error('Session expired (HTML returned instead of JSON)') as any;
      error.isUnauthorized = true;
      error.response = { status: 401, data: response.data };
      return Promise.reject(error);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const responseCode = extractErrorCode(error);
    const responseError = error.response?.data?.error;

    // 401 Unauthorized -> session expired (ONLY for BTP/Approuter session expiry, NEVER for SAP S/4 user mapping errors)
    // Never redirect to /do/logout (which destroys IAS/Entra SSO via Single Logout).
    if (shouldHandleUnauthorized(error) && !isHandlingSessionExpiry) {
      isHandlingSessionExpiry = true;
      console.warn('[Session] Token expired (401) -> attempting silent SSO re-auth or showing expired dialog.');

      const method = (originalRequest?.method || 'get').toLowerCase();
      const isMeEndpoint = originalRequest?.url?.endsWith('/me');
      const sessionActive = sessionStorage.getItem('session_active') === 'true';

      if (isMeEndpoint || !sessionActive || method === 'get') {
        if (!reauthenticateSession(false)) {
          triggerSessionExpiredGlobal();
        }
      } else {
        triggerSessionExpiredGlobal();
      }

      error.isUnauthorized = true;
      return Promise.reject(error);
    }

    // 403 on write operation -> likely CSRF token issue, retry once
    if (error.response?.status === 403 && !originalRequest._retry && responseCode !== 'SAP_AUTH_ERROR') {
      const method = originalRequest.method?.toLowerCase();
      const isWriteOp = method && ['post', 'put', 'patch', 'delete'].includes(method);

      if (isWriteOp) {
        originalRequest._retry = true;
        csrfToken = null;
        await fetchCsrfToken();

        if (csrfToken) {
          originalRequest.headers['X-CSRF-Token'] = csrfToken;
          return axiosInstance(originalRequest);
        }
      }
    }

    // Tag 403 for UI components to detect authorization denial
    if (error.response?.status === 403) {
      error.isForbidden = true;
    }
    if (responseCode === 'SAP_USER_MAPPING_MISSING' || responseCode === 'SAP_AUTH_ERROR') {
      error.isSapUserMappingMissing = true;
    }
    if (responseCode === 'SAP_CONNECTIVITY_ERROR') {
      error.isSapConnectivityError = true;
    }
    if (responseError === 'Unauthorized') {
      error.isUnauthorized = true;
    }

    return Promise.reject(error);
  }
);

function extractErrorCode(error: any): string | undefined {
  const data = error?.response?.data;
  if (!data || typeof data !== 'object') return undefined;
  if (typeof data.code === 'string' && data.code.trim()) {
    return data.code.trim();
  }
  if (data.error && typeof data.error === 'object' && typeof data.error.code === 'string' && data.error.code.trim()) {
    return data.error.code.trim();
  }
  return undefined;
}

function shouldHandleUnauthorized(error: any): boolean {
  if (error.response?.status !== 401) return false;

  const code = extractErrorCode(error);
  if (
    code === 'SAP_AUTH_ERROR' ||
    code === 'SAP_USER_MAPPING_MISSING' ||
    code === 'SAP_CONNECTIVITY_ERROR' ||
    code === 'SAP_BUSINESS_ERROR'
  ) {
    return false;
  }

  const rawMessage =
    (typeof error.response?.data?.error?.message === 'string' ? error.response.data.error.message : '') ||
    (typeof error.response?.data?.message === 'string' ? error.response.data.message : '');
  if (rawMessage.includes('SAP authentication failure') || rawMessage.includes('SAP business/gateway error')) {
    return false;
  }

  const errorText = error.response?.data?.error;
  if (typeof errorText === 'string' && errorText === 'Unauthorized') {
    return true;
  }

  // If backend did not send a structured code, treat as real session expiration.
  return !code;
}

export default axiosInstance;
