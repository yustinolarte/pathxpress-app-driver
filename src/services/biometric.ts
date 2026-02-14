import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

class BiometricService {
    private static instance: BiometricService;
    private isAvailable: boolean = false;
    private biometryType: BiometryType = BiometryType.none;
    private STORAGE_KEY_CREDS = 'user_credentials';
    private STORAGE_KEY_ENABLED = 'biometric_enabled';

    private constructor() {
        this.checkAvailability();
    }

    public static getInstance(): BiometricService {
        if (!BiometricService.instance) {
            BiometricService.instance = new BiometricService();
        }
        return BiometricService.instance;
    }

    public async checkAvailability(): Promise<boolean> {
        try {
            const result = await BiometricAuth.checkBiometry();
            this.isAvailable = result.isAvailable;
            this.biometryType = result.biometryType;
            return result.isAvailable;
        } catch (error) {
            console.error('Biometric check failed', error);
            this.isAvailable = false;
            return false;
        }
    }

    public getBiometryType(): BiometryType {
        return this.biometryType;
    }

    public async enableBiometric(username: string, password: string): Promise<boolean> {
        try {
            if (!this.isAvailable) await this.checkAvailability();
            if (!this.isAvailable) throw new Error('Biometrics not available');

            // Verify identity before saving
            await BiometricAuth.authenticate({
                reason: 'Enable biometric login',
                androidTitle: 'Confirm your identity',
                androidSubtitle: 'Use your fingerprint or face',
                allowDeviceCredential: true
            });

            // Securely store credentials
            await SecureStoragePlugin.set({
                key: this.STORAGE_KEY_CREDS,
                value: JSON.stringify({ username, password })
            });

            // Mark as enabled (this flag can be public/localStorage)
            localStorage.setItem(this.STORAGE_KEY_ENABLED, 'true');

            return true;
        } catch (error) {
            console.error('Failed to enable biometrics', error);
            return false;
        }
    }

    public async disableBiometric(): Promise<void> {
        try {
            await SecureStoragePlugin.remove({ key: this.STORAGE_KEY_CREDS });
        } catch (e) {
            console.warn('Failed to remove secure credentials', e);
        }
        localStorage.removeItem(this.STORAGE_KEY_ENABLED);
    }

    public isBiometricEnabled(): boolean {
        return localStorage.getItem(this.STORAGE_KEY_ENABLED) === 'true';
    }

    public async loginWithBiometric(): Promise<{ username: string, password: string } | null> {
        try {
            if (!this.isBiometricEnabled()) return null;

            await BiometricAuth.authenticate({
                reason: 'Login with biometrics',
                androidTitle: 'Login',
                androidSubtitle: 'Use your fingerprint or face',
                allowDeviceCredential: true
            });

            const { value } = await SecureStoragePlugin.get({ key: this.STORAGE_KEY_CREDS });

            if (value) {
                try {
                    const { username, password } = JSON.parse(value);
                    return { username, password };
                } catch (e) {
                    console.error('Failed to parse stored credentials', e);
                }
            }
            return null;
        } catch (error) {
            console.error('Biometric login failed', error);
            return null;
        }
    }
}

export const biometricService = BiometricService.getInstance();
