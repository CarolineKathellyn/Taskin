import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export interface BiometricCapability {
  isAvailable: boolean;
  biometricType: string | null; // 'fingerprint', 'facial', 'iris', or null
  hasHardware: boolean;
  isEnrolled: boolean;
}

class BiometricService {
  /**
   * Check if device supports biometric authentication
   */
  async checkBiometricCapability(): Promise<BiometricCapability> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType: string | null = null;
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'fingerprint';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'facial';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'iris';
      }

      const isAvailable = hasHardware && isEnrolled;

      return {
        isAvailable,
        biometricType,
        hasHardware,
        isEnrolled,
      };
    } catch (error) {
      console.error('Error checking biometric capability:', error);
      return {
        isAvailable: false,
        biometricType: null,
        hasHardware: false,
        isEnrolled: false,
      };
    }
  }

  /**
   * Authenticate user with biometrics
   * @param promptMessage - Message to show in biometric prompt
   * @returns true if authentication successful, false otherwise
   */
  async authenticate(promptMessage: string = 'Authenticate to continue'): Promise<boolean> {
    try {
      const capability = await this.checkBiometricCapability();

      if (!capability.isAvailable) {
        console.warn('Biometric authentication not available');
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use password',
        disableDeviceFallback: false, // Allow device PIN/pattern as fallback
        cancelLabel: 'Cancel',
      });

      return result.success;
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return false;
    }
  }

  /**
   * Enable biometric authentication for this device/user
   */
  async enableBiometric(): Promise<void> {
    try {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw error;
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw error;
    }
  }

  /**
   * Check if biometric authentication is enabled for current user
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric status:', error);
      return false;
    }
  }

  /**
   * Get user-friendly biometric type name
   */
  getBiometricTypeName(biometricType: string | null): string {
    switch (biometricType) {
      case 'fingerprint':
        return 'Fingerprint';
      case 'facial':
        return 'Face ID';
      case 'iris':
        return 'Iris';
      default:
        return 'Biometric';
    }
  }
}

export default new BiometricService();
