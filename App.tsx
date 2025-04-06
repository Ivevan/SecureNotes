/**
 * SecureNotes App
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { 
  StatusBar, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ActivityIndicator, 
  Alert,
  Switch,
  Modal 
} from 'react-native';
import NoteList from './src/components/NoteList';
import DatabaseService from './src/services/DatabaseService';
import AuthService from './src/services/AuthService';

// Set to true to reset the database on next app start (for development)
const RESET_DATABASE_ON_START = false;

function App(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Initialize the app
  useEffect(() => {
    const initApp = async () => {
      try {
        setLoading(true);
        
        // Check if biometrics are available
        const available = await AuthService.isBiometricAvailable();
        setBiometricAvailable(available);
        
        // Check if biometrics are enabled
        const enabled = await AuthService.isBiometricAuthEnabled();
        setBiometricEnabled(enabled);
        
        console.log('Initializing database...');
        if (RESET_DATABASE_ON_START) {
          try {
            console.log('Resetting database and encryption keys...');
            await DatabaseService.resetDatabase();
            console.log('Database reset complete');
          } catch (resetError) {
            console.error('Error during database reset:', resetError);
            // If reset fails, try to initialize anyway
            await DatabaseService.init();
          }
        } else {
          await DatabaseService.init();
        }
        
        console.log('App initialized successfully');
        
        // If biometrics are available but not enabled, set them up
        if (available && !enabled) {
          // Ask user if they want to enable biometric authentication
          Alert.alert(
            'Biometric Authentication',
            'Would you like to enable fingerprint/face authentication for added security?',
            [
              {
                text: 'Not Now',
                style: 'cancel',
                onPress: () => setAuthenticated(true) // Skip authentication for now
              },
              {
                text: 'Enable',
                onPress: async () => {
                  const setupSuccess = await AuthService.setupBiometricAuthentication();
                  setBiometricEnabled(setupSuccess);
                  
                  if (setupSuccess) {
                    // If setup succeeded, authenticate
                    await authenticate();
                  } else {
                    // If setup failed, skip authentication
                    setAuthenticated(true);
                    Alert.alert('Setup Failed', 'Could not set up biometric authentication. Please check your device settings.');
                  }
                }
              }
            ]
          );
        } else if (enabled) {
          // Try to authenticate if biometrics are enabled
          await authenticate();
        } else {
          // Skip authentication if biometrics aren't available
          setAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        Alert.alert(
          'Error', 
          'Failed to initialize app. Please restart the app.',
          [
            { 
              text: 'Try Again', 
              onPress: () => initApp() 
            }
          ]
        );
      } finally {
        setLoading(false);
      }
    };

    initApp();

    // Clean up on unmount
    return () => {
      DatabaseService.close();
    };
  }, []);

  // Handle authentication
  const authenticate = async () => {
    try {
      const success = await AuthService.authenticateWithBiometrics();
      setAuthenticated(success);
      
      if (!success) {
        Alert.alert('Authentication Failed', 'Please try again to access your notes.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Authentication Error', 'Failed to authenticate. Please try again.');
    }
  };

  // Toggle biometric authentication
  const toggleBiometricAuth = async (value: boolean) => {
    try {
      if (value) {
        // Enable biometric auth
        const success = await AuthService.enableBiometricAuth();
        if (success) {
          setBiometricEnabled(true);
          Alert.alert('Success', 'Biometric authentication enabled successfully.');
        } else {
          Alert.alert('Error', 'Failed to enable biometric authentication.');
        }
      } else {
        // Disable biometric auth
        const success = await AuthService.disableBiometricAuth();
        if (success) {
          setBiometricEnabled(false);
          Alert.alert('Success', 'Biometric authentication disabled.');
        } else {
          Alert.alert('Error', 'Failed to disable biometric authentication.');
        }
      }
    } catch (error) {
      console.error('Error toggling biometric auth:', error);
      Alert.alert('Error', 'An error occurred while updating biometric settings.');
    }
  };

  // Show the settings modal
  const showSettings = () => {
    setSettingsVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#2e7d32" />
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Initializing SecureNotes...</Text>
      </SafeAreaView>
    );
  }
  
  if (!authenticated) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#2e7d32" />
        <Text style={styles.authTitle}>SecureNotes</Text>
        <Text style={styles.authText}>Authentication required to access your notes</Text>
        <TouchableOpacity style={styles.authButton} onPress={authenticate}>
          <Text style={styles.authButtonText}>Authenticate</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2e7d32" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SecureNotes</Text>
        <TouchableOpacity onPress={showSettings}>
          <Text style={styles.settingsButton}>⚙️</Text>
        </TouchableOpacity>
      </View>
      
      <NoteList />
      
      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Security Settings</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>
                Biometric Authentication
                {!biometricAvailable && " (Not Available)"}
              </Text>
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometricAuth}
                disabled={!biometricAvailable}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setSettingsVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  settingsButton: {
    fontSize: 24,
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 20,
  },
  authText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#555',
  },
  authButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  authButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2e7d32',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;
