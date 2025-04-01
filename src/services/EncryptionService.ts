import Aes from 'react-native-aes-crypto';
import * as Keychain from 'react-native-keychain';

class EncryptionService {
  private readonly KEYCHAIN_SERVICE = 'com.securenotes.encryption';
  private readonly KEYCHAIN_USERNAME = 'SecureNotesApp';
  private readonly ENCRYPTION_KEY_SIZE = 256; // bits
  private readonly SALT = 'SecureNotesAppSalt'; // In production, this should be stored securely

  /**
   * Generate or retrieve the encryption key from secure storage
   */
  async getEncryptionKey(): Promise<string> {
    try {
      // Try to retrieve existing key
      const credentials = await Keychain.getGenericPassword({
        service: this.KEYCHAIN_SERVICE,
      });

      if (credentials) {
        return credentials.password;
      }

      // No key exists, generate a new one
      const randomBytes = await Aes.randomKey(this.ENCRYPTION_KEY_SIZE / 8);
      const key = await Aes.pbkdf2(randomBytes, this.SALT, 10000, this.ENCRYPTION_KEY_SIZE / 8, 'sha512');

      // Store the key securely
      await Keychain.setGenericPassword(this.KEYCHAIN_USERNAME, key, {
        service: this.KEYCHAIN_SERVICE,
      });

      return key;
    } catch (error) {
      console.error('Error getting encryption key:', error);
      throw new Error('Failed to secure the encryption key');
    }
  }

  /**
   * Encrypt data with AES
   */
  async encrypt(data: string): Promise<{ encrypted: string; iv: string }> {
    try {
      const key = await this.getEncryptionKey();
      const iv = await Aes.randomKey(16);
      const encrypted = await Aes.encrypt(data, key, iv, 'aes-256-cbc');

      return { encrypted, iv };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data with AES
   */
  async decrypt(encrypted: string, iv: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      const decrypted = await Aes.decrypt(encrypted, key, iv, 'aes-256-cbc');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

export default new EncryptionService(); 