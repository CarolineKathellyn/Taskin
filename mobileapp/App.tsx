import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider, useDispatch } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store, AppDispatch } from './src/store';
import { validateToken } from './src/store/slices/authSlice';
import { fetchUserTeams } from './src/store/slices/teamsSlice';
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

        const result = await dispatch(validateToken());
        console.log('Token validation result:', result);

        // If user is authenticated, fetch teams and populate team_members table
        if (result.type === 'auth/validateToken/fulfilled') {
          console.log('User authenticated, syncing team members...');
          await dispatch(fetchUserTeams());
          console.log('Team members synced to local database');
        }
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
