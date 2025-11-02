import { AppState, AppStateStatus, Alert } from 'react-native';
import { store } from '../store';
import { performDeltaSync, updatePendingChangesCount } from '../store/slices/syncSlice';
import { logoutUser } from '../store/slices/authSlice';
import NetInfo from '@react-native-community/netinfo';
import { AuthService } from './auth/AuthService';

class BackgroundSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private syncIntervalMs = 30000; // 30 seconds
  private appStateSubscription: any = null;
  private authService: AuthService;
  private wasOffline = false;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Start background sync
   */
  start() {
    if (this.isRunning) {
      console.log('[BackgroundSync] Already running');
      return;
    }

    console.log('[BackgroundSync] Starting background sync service');
    this.isRunning = true;

    // Initial sync (non-blocking)
    this.performSync().catch(error => {
      console.error('[BackgroundSync] Initial sync failed:', error);
    });

    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      this.performSync().catch(error => {
        console.error('[BackgroundSync] Periodic sync failed:', error);
      });
    }, this.syncIntervalMs);

    // Listen to app state changes
    try {
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    } catch (error) {
      console.error('[BackgroundSync] Failed to add app state listener:', error);
    }

    // Listen to network changes
    try {
      NetInfo.addEventListener(this.handleNetworkChange);
    } catch (error) {
      console.error('[BackgroundSync] Failed to add network listener:', error);
    }
  }

  /**
   * Stop background sync
   */
  stop() {
    console.log('[BackgroundSync] Stopping background sync service');
    this.isRunning = false;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  /**
   * Set sync interval (in milliseconds)
   */
  setSyncInterval(intervalMs: number) {
    this.syncIntervalMs = intervalMs;

    if (this.isRunning) {
      // Restart with new interval
      this.stop();
      this.start();
    }
  }

  /**
   * Perform sync now
   */
  async performSync() {
    try {
      const state = store.getState();

      // Check if user is authenticated
      if (!state.auth.isAuthenticated || !state.auth.user) {
        console.log('[BackgroundSync] User not authenticated, skipping sync');
        return;
      }

      // Check if already syncing
      if (state.sync.isSyncing) {
        console.log('[BackgroundSync] Sync already in progress, skipping');
        return;
      }

      // Check network connection
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log('[BackgroundSync] No network connection, skipping sync');
        return;
      }

      console.log('[BackgroundSync] Performing delta sync');
      await store.dispatch(performDeltaSync());
      console.log('[BackgroundSync] Delta sync completed');

      // Update pending changes count
      await store.dispatch(updatePendingChangesCount());
    } catch (error) {
      console.error('[BackgroundSync] Sync failed:', error);
    }
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      console.log('[BackgroundSync] App became active, performing sync');
      this.performSync().catch(error => {
        console.error('[BackgroundSync] App state change sync failed:', error);
      });
    } else if (nextAppState === 'background') {
      console.log('[BackgroundSync] App went to background');
    }
  };

  /**
   * Handle network changes
   */
  private handleNetworkChange = async (state: any) => {
    if (state.isConnected && this.wasOffline) {
      console.log('[BackgroundSync] Network reconnected after being offline, validating token');
      this.wasOffline = false;

      // Validate token with server when coming back online
      const authState = store.getState().auth;
      if (authState.isAuthenticated && authState.token) {
        try {
          const isValid = await this.authService.validateTokenWithServer();
          if (!isValid) {
            console.log('[BackgroundSync] Token invalid, logging out user');
            Alert.alert(
              'Sessão Expirada',
              'Sua sessão expirou. Por favor, faça login novamente.',
              [
                {
                  text: 'OK',
                  onPress: () => store.dispatch(logoutUser())
                }
              ]
            );
            return;
          }
          console.log('[BackgroundSync] Token validated successfully');
        } catch (error) {
          console.error('[BackgroundSync] Token validation failed:', error);
          // Don't logout on validation error, might be temporary network issue
        }
      }

      // Perform sync after token validation
      console.log('[BackgroundSync] Network connected, performing sync');
      this.performSync().catch(error => {
        console.error('[BackgroundSync] Network change sync failed:', error);
      });
    } else if (!state.isConnected) {
      console.log('[BackgroundSync] Network disconnected');
      this.wasOffline = true;
    } else if (state.isConnected && !this.wasOffline) {
      // Network is connected and was already connected, just perform sync
      console.log('[BackgroundSync] Network stable, performing sync');
      this.performSync().catch(error => {
        console.error('[BackgroundSync] Network change sync failed:', error);
      });
    }
  };

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      syncIntervalMs: this.syncIntervalMs,
    };
  }
}

export const backgroundSyncService = new BackgroundSyncService();
