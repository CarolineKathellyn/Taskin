import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider, useDispatch } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store, AppDispatch } from './src/store';
import { DatabaseService } from './src/services/database/DatabaseService';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/contexts/ThemeContext';

const databaseService = DatabaseService.getInstance();

function AppInitializer() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        await databaseService.initializeDatabase();
        console.log('Database initialized');

        // Removed automatic token validation - user must login on every app open
        console.log('App initialized - user must login');
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };

    initializeApp();
  }, [dispatch]);

  return <AppNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppInitializer />
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
