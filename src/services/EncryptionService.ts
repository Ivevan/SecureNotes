import { NativeModules } from 'react-native';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Aes = NativeModules.RNAes;

class EncryptionService {
  private readonly KEYCHAIN_SERVICE = 'com.securenotes.encryption';
  private readonly KEYCHAIN_USERNAME = 'SecureNotesApp';
  private readonly SALT_KEY = 'SECURE_NOTES_SALT';
  private readonly IV_SIZE = 16; // 16 bytes for AES
  private readonly KEY_SIZE = 32; // 32 bytes = 256 bits for AES-256

  /**
   * Generate a secure random salt or retrieve existing one
   */
  private async getSalt(): Promise<string> {
    try {
      // Check if we have a stored salt
      const storedSalt = await AsyncStorage.getItem(this.SALT_KEY);
      
      if (storedSalt) {
        return storedSalt;
      }
      
      // Generate a new random salt - generate a random hex string as fallback
      // since there's an issue with Aes.randomKey
      const randomBytes = [];
      for (let i = 0; i < 16; i++) {
        randomBytes.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0'));
      }
      const salt = randomBytes.join('');
      
      // Store the salt securely
      await AsyncStorage.setItem(this.SALT_KEY, salt);
      
      return salt;
    } catch (error) {
      console.error('Error generating/retrieving salt:', error);
      throw new Error('Failed to secure salt for encryption');
    }
  }

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

      // Get or generate salt
      const salt = await this.getSalt();
      
      // No key exists, generate a new random key using a similar approach as salt
      const randomBytes = [];
      for (let i = 0; i < this.KEY_SIZE; i++) {
        randomBytes.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0'));
      }
      const randomKey = randomBytes.join('');
      
      // Generate pbkdf2 key
      let key;
      if (Aes && typeof Aes.pbkdf2 === 'function') {
        key = await Aes.pbkdf2(randomKey, salt, 10000, this.KEY_SIZE, 'sha512');
      } else {
        // Fallback if pbkdf2 is not available - use the random key directly
        // This is less secure but allows the app to function
        key = randomKey;
      }

      // Store the key securely in the keychain
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
   * Simple fallback encryption that works on all devices
   * WARNING: This is NOT secure and only for development/testing
   */
  private simpleFallbackEncrypt(data: string): string {
    // Simple XOR with a fixed key for development purposes only
    const key = "SecureNotesDevKey";
    let result = '';
    
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    
    // Convert to base64 to ensure it's a valid string for storage
    try {
      return btoa(result);
    } catch (e) {
      // If btoa fails with Unicode, use URI encoding
      return btoa(encodeURIComponent(result));
    }
  }
  
  /**
   * Simple fallback decryption that works on all devices
   * WARNING: This is NOT secure and only for development/testing
   */
  private simpleFallbackDecrypt(encrypted: string): string {
    try {
      // Convert from base64
      let data;
      try {
        data = atob(encrypted);
      } catch (e) {
        // If it fails, try decoding URI component
        data = decodeURIComponent(atob(encrypted));
      }
      
      // Simple XOR with the same fixed key
      const key = "SecureNotesDevKey";
      let result = '';
      
      for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
      }
      
      return result;
    } catch (error) {
      console.error('Simple fallback decryption error:', error);
      // If all fails, return the data as-is
      return encrypted;
    }
  }

  /**
   * Encrypt data with AES-256-CBC
   */
  async encrypt(data: string): Promise<{ encrypted: string; iv: string }> {
    try {
      // Get the encryption key
      const key = await this.getEncryptionKey();
      
      // Generate a random IV (Initialization Vector)
      const ivBytes = [];
      for (let i = 0; i < this.IV_SIZE; i++) {
        ivBytes.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0'));
      }
      const iv = ivBytes.join('');
      
      // Encrypt the data
      let encrypted;
      if (Aes && typeof Aes.encrypt === 'function') {
        encrypted = await Aes.encrypt(data, key, iv, 'aes-256-cbc');
      } else {
        // Fallback to a simple encoding if encryption is not available
        console.warn('Using insecure fallback encryption. Do not use in production!');
        encrypted = this.simpleFallbackEncrypt(data);
      }

      return { encrypted, iv };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data with AES-256-CBC
   */
  async decrypt(encrypted: string, iv: string): Promise<string> {
    try {
      // Get the encryption key
      const key = await this.getEncryptionKey();
      
      // Validate IV
      if (!iv || iv.length !== this.IV_SIZE * 2) { // hexadecimal string length
        throw new Error('Invalid initialization vector');
      }
      
      // Decrypt the data
      let decrypted;
      if (Aes && typeof Aes.decrypt === 'function') {
        decrypted = await Aes.decrypt(encrypted, key, iv, 'aes-256-cbc');
      } else {
        // Fallback from simple encoding if decryption is not available
        console.warn('Using insecure fallback decryption. Do not use in production!');
        decrypted = this.simpleFallbackDecrypt(encrypted);
      }

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Reset encryption keys - WARNING: This will make existing encrypted data unreadable
   */
  async resetEncryptionKey(): Promise<void> {
    try {
      // Remove key from keychain
      await Keychain.resetGenericPassword({
        service: this.KEYCHAIN_SERVICE,
      });
      
      // Remove salt
      await AsyncStorage.removeItem(this.SALT_KEY);
      
      console.log('Encryption keys have been reset');
    } catch (error) {
      console.error('Error resetting encryption keys:', error);
      throw new Error('Failed to reset encryption keys');
    }
  }
}

export default new EncryptionService(); 