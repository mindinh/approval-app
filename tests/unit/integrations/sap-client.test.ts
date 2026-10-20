import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { executeHttpRequest } from '@sap-cloud-sdk/http-client';
import { SapClient } from '../../../srv/lib/integrations/sap-client';

vi.mock('axios', () => ({ default: { create: vi.fn() } }));
vi.mock('@sap-cloud-sdk/http-client', () => ({ executeHttpRequest: vi.fn() }));

describe('SapClient explicit connection configuration', () => {
  const directGet = vi.fn();
  const configureDirect = () => {
    vi.stubEnv('SAP_TASK_BASE_URL', 'https://sap.example.test');
    vi.stubEnv('SAP_TASK_USER', 'test-user');
    vi.stubEnv('SAP_TASK_PASSWORD', 'test-password');
  };

  beforeEach(() => {
    vi.clearAllMocks();
    for (const name of ['SAP_TASK_BASE_URL', 'SAP_TASK_USER', 'SAP_TASK_PASSWORD',
      'SAP_TASK_DESTINATION', 'SAP_DEV_JWT', 'SAP_DEV_OVERRIDE_DESTINATION']) vi.stubEnv(name, '');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('SAP_USE_DESTINATION', 'false');
    directGet.mockResolvedValue({ data: { source: 'direct' } });
    vi.mocked(axios.create).mockReturnValue({ get: directGet, defaults: {} } as any);
    vi.mocked(executeHttpRequest).mockResolvedValue({ data: { source: 'destination' } } as any);
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each(['SAP_TASK_BASE_URL', 'SAP_TASK_USER', 'SAP_TASK_PASSWORD'])(
    'does not contact SAP when direct setting %s is missing', async name => {
      configureDirect();
      vi.stubEnv(name, '');
      await expect(new SapClient().get('/service', '/entity')).rejects.toThrow(name);
      expect(directGet).not.toHaveBeenCalled();
      expect(executeHttpRequest).not.toHaveBeenCalled();
    },
  );

  it('uses explicit direct host and credentials', async () => {
    configureDirect();
    await expect(new SapClient().get('/service', '/entity')).resolves.toEqual({ source: 'direct' });
    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({ baseURL: 'https://sap.example.test' }));
    expect(vi.mocked(axios.create).mock.results[0].value.defaults.auth)
      .toEqual({ username: 'test-user', password: 'test-password' });
  });

  it('uses destination without requiring or constructing a direct client', async () => {
    vi.stubEnv('SAP_USE_DESTINATION', 'true');
    vi.stubEnv('SAP_TASK_DESTINATION', 'TEST_DESTINATION');
    await expect(new SapClient().get('/service', '/entity')).resolves.toEqual({ source: 'destination' });
    expect(executeHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({ destinationName: 'TEST_DESTINATION' }), expect.anything());
    expect(axios.create).not.toHaveBeenCalled();
  });

  it('does not substitute a hardcoded destination when its name is missing', async () => {
    vi.stubEnv('SAP_USE_DESTINATION', 'true');
    await expect(new SapClient().get('/service', '/entity')).rejects.toThrow('SAP_TASK_DESTINATION');
    expect(executeHttpRequest).not.toHaveBeenCalled();
    expect(directGet).not.toHaveBeenCalled();
  });

  it('keeps local direct fallback when all direct settings are explicit', async () => {
    configureDirect();
    vi.stubEnv('SAP_USE_DESTINATION', 'true');
    vi.stubEnv('SAP_TASK_DESTINATION', 'TEST_DESTINATION');
    await expect(new SapClient().get('/service', '/entity')).resolves.toEqual({ source: 'direct' });
    expect(executeHttpRequest).not.toHaveBeenCalled();
  });

  it('preserves destination header errors when direct settings are absent', async () => {
    vi.stubEnv('SAP_USE_DESTINATION', 'true');
    vi.stubEnv('SAP_TASK_DESTINATION', 'TEST_DESTINATION');
    vi.mocked(executeHttpRequest).mockRejectedValue(new Error('Failed to build headers.'));
    await expect(new SapClient().get('/service', '/entity')).rejects.toThrow('Failed to build headers.');
    expect(directGet).not.toHaveBeenCalled();
  });

  it('uses configured local direct fallback after a destination header failure', async () => {
    configureDirect();
    vi.stubEnv('SAP_USE_DESTINATION', 'true');
    vi.stubEnv('SAP_TASK_DESTINATION', 'TEST_DESTINATION');
    const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
    vi.mocked(executeHttpRequest).mockRejectedValue(new Error('Failed to build headers.'));
    await expect(new SapClient().get('/service', '/entity', {}, undefined, `test.${payload}.test`))
      .resolves.toEqual({ source: 'direct' });
    expect(executeHttpRequest).toHaveBeenCalledOnce();
    expect(directGet).toHaveBeenCalledOnce();
  });

  it('rejects a non-HTTP direct URL before creating the transport', async () => {
    configureDirect();
    vi.stubEnv('SAP_TASK_BASE_URL', '/relative-host');
    await expect(new SapClient().get('/service', '/entity')).rejects.toThrow('SAP_TASK_BASE_URL');
    expect(axios.create).not.toHaveBeenCalled();
  });

  it.each(['production', 'override'])('does not fall back when blocked by %s', async mode => {
    configureDirect();
    vi.stubEnv('SAP_USE_DESTINATION', 'true');
    vi.stubEnv('SAP_TASK_DESTINATION', 'TEST_DESTINATION');
    if (mode === 'production') vi.stubEnv('NODE_ENV', 'production');
    else vi.stubEnv('SAP_DEV_OVERRIDE_DESTINATION', 'false');
    vi.mocked(executeHttpRequest).mockRejectedValue(new Error('Failed to build headers.'));
    await expect(new SapClient().get('/service', '/entity')).rejects.toThrow('Failed to build headers.');
    expect(directGet).not.toHaveBeenCalled();
  });
});
