import { biometryLabel } from '@/lib/security/app-lock';

jest.mock('expo-local-authentication', () => ({ AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 } }));
jest.mock('expo-secure-store', () => ({ AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 0 }));

describe('biometryLabel', () => {
    it('names the method like the platform does', () => {
        expect(biometryLabel([2], true)).toBe('Face ID');
        expect(biometryLabel([1], true)).toBe('Touch ID');
        expect(biometryLabel([1], false)).toBe('Fingerprint');
        expect(biometryLabel([1, 2], false)).toBe('Biometrics');
    });
});
