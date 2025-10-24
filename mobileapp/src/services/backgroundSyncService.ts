import { AppState, AppStateStatus } from 'react-native';
import { store } from '../store';
import { performDeltaSync, updatePendingChangesCount } from '../store/slices/syncSlice';
import NetInfo from '@react-native-community/netinfo';

class BackgroundSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private syncIntervalMs = 30000; // 30 seconds
  private appStateSubscription: any = null;

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
  private handleNetworkChange = (state: any) => {
    if (state.isConnected) {
      console.log('[BackgroundSync] Network connected, performing sync');
      this.performSync().catch(error => {
        console.error('[BackgroundSync] Network change sync failed:', error);
      });
    } else {
      console.log('[BackgroundSync] Network disconnected');
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
