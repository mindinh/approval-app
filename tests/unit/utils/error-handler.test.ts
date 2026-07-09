import { describe, it, expect } from 'vitest';
import { AppError, handleSapError } from '../../../srv/lib/utils/error-handler';

describe('error-handler', () => {
  describe('AppError', () => {
    it('should initialize with default status and code', () => {
      const err = new AppError('Some error');
      expect(err.message).toBe('Some error');
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe('INTERNAL_ERROR');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
    });

    it('should initialize with custom status and code', () => {
      const err = new AppError('Custom message', 400, 'BAD_REQUEST');
      expect(err.message).toBe('Custom message');
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('BAD_REQUEST');
    });
  });

  describe('handleSapError', () => {
    it('should handle SAP Gateway auth errors (401)', () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            error: {
              message: {
                value: 'Unauthorized access to service'
              }
            }
          }
        },
        message: 'Request failed with status code 401'
      };

      const result = handleSapError(mockError);
      expect(result.statusCode).toBe(401);
      expect(result.code).toBe('SAP_AUTH_ERROR');
      expect(result.message).toContain('SAP authentication failure: Unauthorized access to service');
    });

    it('should handle SAP Gateway auth errors (403) with raw string message', () => {
      const mockError = {
        response: {
          status: 403,
          data: {
            error: {
              message: 'Forbidden CSRF check failed'
            }
          }
        },
        message: 'Request failed with status code 403'
      };

      const result = handleSapError(mockError);
      expect(result.statusCode).toBe(403);
      expect(result.code).toBe('SAP_AUTH_ERROR');
      expect(result.message).toContain('SAP authentication failure: Forbidden CSRF check failed');
    });

    it('should handle SAP Gateway business/other errors (500)', () => {
      const mockError = {
        response: {
          status: 500,
          data: 'Internal Server Error detail'
        },
        message: 'Request failed with status code 500'
      };

      const result = handleSapError(mockError);
      expect(result.statusCode).toBe(500);
      expect(result.code).toBe('SAP_BUSINESS_ERROR');
      expect(result.message).toContain('SAP business/gateway error: Request failed with status code 500');
    });

    it('should handle SAP connectivity/network failures (no response received)', () => {
      const mockError = {
        request: {},
        message: 'Network connection timeout'
      };

      const result = handleSapError(mockError);
      expect(result.statusCode).toBe(502);
      expect(result.code).toBe('SAP_CONNECTIVITY_ERROR');
      expect(result.message).toBe('Unable to connect to SAP system. Please check your connectivity / cloud connector.');
    });

    it('should handle general integration errors', () => {
      const mockError = new Error('Local parsing exception');

      const result = handleSapError(mockError);
      expect(result.statusCode).toBe(500);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('Local parsing exception');
    });
  });
});
