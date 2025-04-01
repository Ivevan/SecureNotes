/**
 * SecureNotes App
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NoteList from './src/components/NoteList';
import DatabaseService from './src/services/DatabaseService';

// Set to true to reset the database on next app start (for development)
const RESET_DATABASE_ON_START = false;

function App(): React.JSX.Element {
  // Initialize database on app start
  useEffect(() => {
    const initDb = async () => {
      try {
        if (RESET_DATABASE_ON_START) {
          await DatabaseService.resetDatabase();
        } else {
          await DatabaseService.init();
        }
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initDb();

    // Close database when the app is unmounted
    return () => {
      DatabaseService.close();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2e7d32" />
      <NoteList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
