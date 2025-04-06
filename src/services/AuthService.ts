import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  private readonly AUTH_KEY = 'SECURE_NOTES_AUTH';
  private readonly BIOMETRIC_AUTH_KEY = 'BIOMETRIC_AUTH_ENABLED';
  
  /**
   * Check if biometric authentication is supported on the device
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const biometricTypes = await Keychain.getSupportedBiometryType();
      return biometricTypes !== null;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }
  
  /**
   * Enable biometric authentication
   */
  async enableBiometricAuth(): Promise<boolean> {
    try {
      const isAvailable = await this.isBiometricAvailable();
      
      if (!isAvailable) {
        console.log('Biometric authentication not available on this device');
        return false;
      }
      
      // Store a flag indicating biometric auth is enabled
      await AsyncStorage.setItem(this.BIOMETRIC_AUTH_KEY, 'true');
      
      // Store a dummy value in the keychain with biometric authentication
      await Keychain.setGenericPassword('secureNotesUser', 'biometricAuth', {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      
      return true;
    } catch (error) {
      console.error('Error enabling biometric auth:', error);
      return false;
    }
  }
  
  /**
   * Check if biometric authentication is enabled
   */
  async isBiometricAuthEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(this.BIOMETRIC_AUTH_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking if biometric auth is enabled:', error);
      return false;
    }
  }
  
  /**
   * Authenticate using biometrics
   */
  async authenticateWithBiometrics(promptMessage = 'Authenticate to access your secure notes'): Promise<boolean> {
    try {
      // Check if biometric auth is enabled
      const isEnabled = await this.isBiometricAuthEnabled();
      
      if (!isEnabled) {
        console.log('Biometric authentication not enabled');
        return true; // Allow access if biometric auth is not enabled
      }
      
      // Authenticate with biometrics
      const result = await Keychain.getGenericPassword({
        authenticationPrompt: {
          title: 'Biometric Authentication',
          subtitle: 'Verify your identity',
          description: promptMessage,
          cancel: 'Cancel',
        },
      });
      
      return !!result;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false; // Return false if authentication fails
    }
  }
  
  /**
   * Disable biometric authentication
   */
  async disableBiometricAuth(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.BIOMETRIC_AUTH_KEY);
      await Keychain.resetGenericPassword();
      return true;
    } catch (error) {
      console.error('Error disabling biometric auth:', error);
      return false;
    }
  }
  
  /**
   * Setup biometric authentication for first use
   * This helps ensure that devices are properly configured
   */
  async setupBiometricAuthentication(): Promise<boolean> {
    try {
      // Check if biometrics are available
      const isAvailable = await this.isBiometricAvailable();
      
      if (!isAvailable) {
        console.log('Biometric authentication not available on this device');
        return false;
      }
      
      // Check if already enabled
      const isEnabled = await this.isBiometricAuthEnabled();
      if (isEnabled) {
        return true;
      }
      
      // Try to set up biometric authentication
      return await this.enableBiometricAuth();
    } catch (error) {
      console.error('Error setting up biometric authentication:', error);
      return false;
    }
  }
}

export default new AuthService(); 