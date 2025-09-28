import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider, useDispatch } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store, AppDispatch } from './src/store';
import { validateToken } from './src/store/slices/authSlice';
import { DatabaseService } from './src/services/database/DatabaseService';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/contexts/ThemeContext';

const databaseService = new DatabaseService();

function AppInitializer() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        await databaseService.initializeDatabase();
        console.log('Database initialized');

        const result = await dispatch(validateToken());
        console.log('Token validation result:', result);
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
