import axios, { AxiosInstance } from 'axios';
import { executeHttpRequest } from '@sap-cloud-sdk/http-client';
import { Logger } from '../utils/logger';
import { handleSapError } from '../utils/error-handler';

export class SapClient {
    private http: AxiosInstance;
    private useDestination: boolean;
    private destinationName: string;
    private logger = new Logger('SapClient');

    constructor() {
        this.useDestination = process.env.SAP_USE_DESTINATION === 'true';
        this.destinationName = process.env.SAP_TASK_DESTINATION || 'SAP_ABAP_BACKEND';

        const baseURL = process.env.SAP_TASK_BASE_URL || 'http://s4hanadev.ais-tech.vn:8000';
        this.logger.info(`Initializing direct Axios instance. Base URL: ${baseURL}`);

        this.http = axios.create({
            baseURL,
            timeout: 30000,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'sap-client': process.env.SAP_TASK_CLIENT || '100'
            }
        });

        const username = process.env.SAP_TASK_USER || 'MINHDT';
        const password = process.env.SAP_TASK_PASSWORD || 'Mdt@150503';
        this.http.defaults.auth = { username, password };

        if (this.useDestination) {
            this.logger.info(`Destination mode active. Destination: ${this.destinationName}`);
        }
    }

    private useDirectCallFallback = false;
    private hasLoggedDirectFallback = false;

    private isTokenValid(token?: string): boolean {
        if (!token) return false;
        try {
            const parts = token.split('.');
            if (parts.length < 2) return false;
            const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
            const payload = JSON.parse(payloadJson);
            if (payload && typeof payload.exp === 'number') {
                const bufferSeconds = 60; // 1 minute buffer
                return payload.exp * 1000 > (Date.now() + bufferSeconds * 1000);
            }
            return false;
        } catch {
            return false;
        }
    }

    private getEffectiveJwt(userJwt?: string): string | undefined {
        if (this.isTokenValid(userJwt)) {
            return userJwt;
        }
        const devJwt = process.env.SAP_DEV_JWT;
        if (this.isTokenValid(devJwt)) {
            return devJwt;
        }
        return undefined;
    }

    private shouldUseDestination(effectiveJwt?: string): boolean {
        if (!this.useDestination || this.useDirectCallFallback) {
            return false;
        }
        if (process.env.NODE_ENV === 'production') {
            return true;
        }
        if (process.env.SAP_DEV_OVERRIDE_DESTINATION === 'false') {
            return true;
        }
        if (effectiveJwt) {
            return true;
        }

        if (!this.hasLoggedDirectFallback) {
            this.logger.warn('No valid User JWT found (or token expired) in local development. Bypassing BTP Destination/Principal Propagation and falling back to direct S/4 connection using technical user basic credentials.');
            this.hasLoggedDirectFallback = true;
        }
        return false;
    }

    private shouldFallbackToDirect(error: any): boolean {
        if (process.env.NODE_ENV === 'production' || process.env.SAP_DEV_OVERRIDE_DESTINATION === 'false') {
            return false;
        }
        const message = error instanceof Error ? error.message : String(error);
        const isHeaderFailure = message.includes('Failed to build headers.');
        if (isHeaderFailure) {
            if (!this.useDirectCallFallback) {
                this.logger.warn('[SapClient] Failed to build headers for destination (Principal Propagation / Connectivity proxy is unavailable locally). Falling back to direct calls via technical user.');
                this.useDirectCallFallback = true;
            }
        }
        return isHeaderFailure;
    }

    private getRequestHeaders(sapUser?: string, customHeaders: any = {}): Record<string, string> {
        const headers: Record<string, string> = {
            'sap-client': process.env.SAP_TASK_CLIENT || '100',
            ...customHeaders
        };

        const sendSapUser = process.env.SAP_SEND_USER_HEADER === 'true';
        if (sendSapUser && sapUser) {
            headers['sap-user'] = sapUser;
        }

        return headers;
    }

    private csrfCache = new Map<string, { token: string; cookie?: string; fetchedAt: number }>();
    private readonly CSRF_TTL = 10 * 60 * 1000; // 10 minutes

    async get<T>(servicePath: string, relativePath: string, params: any = {}, sapUser?: string, userJwt?: string): Promise<T> {
        try {
            const effectiveJwt = this.getEffectiveJwt(userJwt);
            if (this.shouldUseDestination(effectiveJwt)) {
                let requestUrl = `${servicePath}${relativePath}`;
                if (params && Object.keys(params).length > 0) {
                    const searchParams = new URLSearchParams();
                    for (const [key, value] of Object.entries(params)) {
                        searchParams.append(key, String(value));
                    }
                    const separator = requestUrl.includes('?') ? '&' : '?';
                    requestUrl = `${requestUrl}${separator}${searchParams.toString()}`;
                }

                try {
                    const response = await executeHttpRequest(
                        { destinationName: this.destinationName, jwt: effectiveJwt },
                        {
                            method: 'get',
                            url: requestUrl,
                            headers: this.getRequestHeaders(sapUser)
                        }
                    );
                    return response.data as T;
                } catch (error: any) {
                    if (this.shouldFallbackToDirect(error)) {
                        const response = await this.http.get<T>(`${servicePath}${relativePath}`, {
                            params,
                            headers: this.getRequestHeaders(sapUser)
                        });
                        return response.data;
                    }
                    throw error;
                }
            } else {
                const response = await this.http.get<T>(`${servicePath}${relativePath}`, {
                    params,
                    headers: this.getRequestHeaders(sapUser)
                });
                return response.data;
            }
        } catch (error: any) {
            throw handleSapError(error);
        }
    }

    async post<T>(servicePath: string, relativePath: string, data: any = {}, headers: any = {}, sapUser?: string, userJwt?: string): Promise<T> {
        const finalHeaders = { ...headers };
        const hasCsrfToken = Object.keys(finalHeaders).some(k => k.toLowerCase() === 'x-csrf-token');
        if (!hasCsrfToken) {
            try {
                const fresh = await this.fetchCsrf(servicePath, sapUser, userJwt);
                finalHeaders['x-csrf-token'] = fresh.token;
                if (fresh.cookie && !finalHeaders.Cookie && !finalHeaders.cookie) {
                    finalHeaders.Cookie = fresh.cookie;
                }
            } catch (e: any) {
                this.logger.warn(`Failed to fetch CSRF token proactively for POST to ${servicePath}${relativePath}: ${e.message}`);
            }
        }

        const executePost = async (currentHeaders: any) => {
            const effectiveJwt = this.getEffectiveJwt(userJwt);
            if (this.shouldUseDestination(effectiveJwt)) {
                try {
                    const response = await executeHttpRequest(
                        { destinationName: this.destinationName, jwt: effectiveJwt },
                        {
                            method: 'post',
                            url: `${servicePath}${relativePath}`,
                            data,
                            headers: this.getRequestHeaders(sapUser, currentHeaders)
                        }
                    );
                    return response.data as T;
                } catch (error: any) {
                    if (this.shouldFallbackToDirect(error)) {
                        const response = await this.http.post<T>(`${servicePath}${relativePath}`, data, {
                            headers: this.getRequestHeaders(sapUser, currentHeaders)
                        });
                        return response.data;
                    }
                    throw error;
                }
            } else {
                const response = await this.http.post<T>(`${servicePath}${relativePath}`, data, {
                    headers: this.getRequestHeaders(sapUser, currentHeaders)
                });
                return response.data;
            }
        };

        try {
            return await executePost(finalHeaders);
        } catch (error: any) {
            const isForbidden = error.response?.status === 403 || error.status === 403;
            if (isForbidden) {
                this.logger.warn(`POST request to ${servicePath}${relativePath} failed with 403 Forbidden. Invalidating CSRF cache and retrying...`);
                this.invalidateCsrf(servicePath, sapUser);

                const fresh = await this.fetchCsrf(servicePath, sapUser, userJwt, true);
                const retriedHeaders = { ...headers };
                retriedHeaders['x-csrf-token'] = fresh.token;
                if (fresh.cookie) {
                    retriedHeaders.Cookie = fresh.cookie;
                }

                try {
                    return await executePost(retriedHeaders);
                } catch (retryError: any) {
                    throw handleSapError(retryError);
                }
            }
            throw handleSapError(error);
        }
    }

    async fetchCsrf(servicePath: string, sapUser?: string, userJwt?: string, forceRefresh = false): Promise<{ token: string; cookie?: string }> {
        const cacheKey = `${sapUser || 'anonymous'}:${servicePath}`;
        if (!forceRefresh) {
            const cached = this.csrfCache.get(cacheKey);
            if (cached && (Date.now() - cached.fetchedAt < this.CSRF_TTL)) {
                return { token: cached.token, cookie: cached.cookie };
            }
        }

        try {
            const effectiveJwt = this.getEffectiveJwt(userJwt);
            let token = '';
            let cookie: string | undefined = undefined;

            if (this.shouldUseDestination(effectiveJwt)) {
                try {
                    const response = await executeHttpRequest(
                        { destinationName: this.destinationName, jwt: effectiveJwt },
                        {
                            method: 'get',
                            url: servicePath,
                            headers: this.getRequestHeaders(sapUser, { 'x-csrf-token': 'Fetch' })
                        }
                    );
                    token = response.headers['x-csrf-token'] as string;
                    const cookies = response.headers['set-cookie'] as string[];
                    cookie = cookies ? cookies.join('; ') : undefined;
                } catch (error: any) {
                    if (this.shouldFallbackToDirect(error)) {
                        const response = await this.http.get(servicePath, {
                            headers: this.getRequestHeaders(sapUser, { 'x-csrf-token': 'Fetch' })
                        });
                        token = response.headers['x-csrf-token'] as string;
                        const cookies = response.headers['set-cookie'] as string[];
                        cookie = cookies ? cookies.join('; ') : undefined;
                    } else {
                        throw error;
                    }
                }
            } else {
                const response = await this.http.get(servicePath, {
                    headers: this.getRequestHeaders(sapUser, { 'x-csrf-token': 'Fetch' })
                });
                token = response.headers['x-csrf-token'] as string;
                const cookies = response.headers['set-cookie'] as string[];
                cookie = cookies ? cookies.join('; ') : undefined;
            }

            const entry = { token: token || '', cookie, fetchedAt: Date.now() };
            this.csrfCache.set(cacheKey, entry);
            return entry;
        } catch (error: any) {
            throw handleSapError(error);
        }
    }

    invalidateCsrf(servicePath: string, sapUser?: string): void {
        const cacheKey = `${sapUser || 'anonymous'}:${servicePath}`;
        this.csrfCache.delete(cacheKey);
        this.logger.info(`Invalidated cached CSRF token for key: ${cacheKey}`);
    }

    async batchGet(
        servicePath: string,
        requests: Array<{ relativePath: string; params?: any }>,
        sapUser?: string,
        userJwt?: string
    ): Promise<any[]> {
        if (!requests || requests.length === 0) {
            return [];
        }

        const boundary = 'batch_' + Math.random().toString(36).substring(2, 15);
        const body = this.buildBatchGetBody(requests, boundary);

        const headers: Record<string, string> = {
            'Content-Type': `multipart/mixed; boundary=${boundary}`,
            'Accept': 'multipart/mixed'
        };

        try {
            const effectiveJwt = this.getEffectiveJwt(userJwt);
            let responseData = '';
            let responseHeaders: Record<string, any> = {};

            if (this.shouldUseDestination(effectiveJwt)) {
                try {
                    const response = await executeHttpRequest(
                        { destinationName: this.destinationName, jwt: effectiveJwt },
                        {
                            method: 'post',
                            url: `${servicePath}/$batch`,
                            data: body,
                            headers: this.getRequestHeaders(sapUser, headers)
                        }
                    );
                    responseData = response.data;
                    responseHeaders = response.headers;
                } catch (error: any) {
                    if (this.shouldFallbackToDirect(error)) {
                        const response = await this.http.post(`${servicePath}/$batch`, body, {
                            headers: this.getRequestHeaders(sapUser, headers)
                        });
                        responseData = response.data;
                        responseHeaders = response.headers;
                    } else {
                        throw error;
                    }
                }
            } else {
                const response = await this.http.post(`${servicePath}/$batch`, body, {
                    headers: this.getRequestHeaders(sapUser, headers)
                });
                responseData = response.data;
                responseHeaders = response.headers;
            }

            const contentType = responseHeaders['content-type'] || '';
            const boundaryMatch = contentType.match(/boundary=([\w\-]+)/i);
            let responseBoundary = boundaryMatch ? boundaryMatch[1] : undefined;

            if (!responseBoundary && typeof responseData === 'string') {
                const firstLine = responseData.split('\r\n')[0] || '';
                if (firstLine.startsWith('--')) {
                    responseBoundary = firstLine.substring(2).trim();
                }
            }

            return this.parseBatchResponse(typeof responseData === 'string' ? responseData : String(responseData), responseBoundary || boundary);
        } catch (error: any) {
            throw handleSapError(error);
        }
    }

    private buildBatchGetBody(requests: Array<{ relativePath: string; params?: any }>, boundary: string): string {
        let body = '';
        for (const req of requests) {
            body += `--${boundary}\r\n`;
            body += 'Content-Type: application/http\r\n';
            body += 'Content-Transfer-Encoding: binary\r\n\r\n';

            let url = req.relativePath;
            const queryParams = { ...req.params, $format: 'json' };
            const searchParams = new URLSearchParams();
            for (const [k, v] of Object.entries(queryParams)) {
                searchParams.append(k, String(v));
            }
            url += `?${searchParams.toString()}`;

            body += `GET ${url} HTTP/1.1\r\n`;
            body += 'Accept: application/json\r\n\r\n';
        }
        body += `--${boundary}--\r\n`;
        return body;
    }

    private parseBatchResponse(responseBody: string, boundary: string): any[] {
        const parts = responseBody.split(`--${boundary}`);
        const results: any[] = [];

        for (const part of parts) {
            if (part.trim() === '' || part.trim() === '--') {
                continue;
            }

            const statusMatch = part.match(/HTTP\/1\.\d\s+(\d+)/);
            const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 500;

            const doubleCrlfIndex = part.indexOf('\r\n\r\n');
            if (doubleCrlfIndex !== -1) {
                const content = part.substring(doubleCrlfIndex + 4).trim();
                const jsonStr = content.endsWith('--') ? content.slice(0, -2).trim() : content;

                try {
                    if (statusCode >= 200 && statusCode < 300) {
                        const parsed = JSON.parse(jsonStr);
                        results.push(parsed);
                    } else {
                        console.warn(`[SapClient] Batch part failed with status ${statusCode}:`, jsonStr);
                        results.push({ error: true, statusCode, message: jsonStr });
                    }
                } catch (e) {
                    results.push({ error: true, statusCode, message: 'Invalid JSON response' });
                }
            } else {
                results.push({ error: true, statusCode, message: 'Malformed batch part response' });
            }
        }
        return results;
    }
}
