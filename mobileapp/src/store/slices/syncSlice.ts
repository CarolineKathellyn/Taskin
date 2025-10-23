import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SyncState, DeltaSyncResponse } from '../../types';
import { deltaSyncService } from '../../services/deltaSyncService';
import { RootState } from '../index';

const initialState: SyncState = {
  lastSyncAt: null,
  isSyncing: false,
  error: null,
  pendingChanges: 0,
};

// Async thunks for delta sync
export const performDeltaSync = createAsyncThunk(
  'sync/performDeltaSync',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await deltaSyncService.sync(userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sync failed');
    }
  }
);

export const updatePendingChangesCount = createAsyncThunk(
  'sync/updatePendingChangesCount',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.id;

      if (!userId) {
        return 0;
      }

      const count = await deltaSyncService.getPendingChangesCount(userId);
      return count;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get pending changes count');
    }
  }
);

export const logSyncChange = createAsyncThunk(
  'sync/logChange',
  async (
    { entityType, entityId, action, data }: {
      entityType: 'task' | 'project' | 'category';
      entityId: string;
      action: 'create' | 'update' | 'delete';
      data: any;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      await deltaSyncService.logChange(userId, entityType, entityId, action, data);
      return { entityType, entityId, action };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to log change');
    }
  }
);

export const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setLastSyncAt: (state, action: PayloadAction<string>) => {
      state.lastSyncAt = action.payload;
    },
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearSyncError: (state) => {
      state.error = null;
    },
    setPendingChanges: (state, action: PayloadAction<number>) => {
      state.pendingChanges = action.payload;
    },
    incrementPendingChanges: (state) => {
      state.pendingChanges += 1;
    },
    decrementPendingChanges: (state) => {
      if (state.pendingChanges > 0) {
        state.pendingChanges -= 1;
      }
    },
    resetPendingChanges: (state) => {
      state.pendingChanges = 0;
    },
  },
  extraReducers: (builder) => {
    // Perform delta sync
    builder.addCase(performDeltaSync.pending, (state) => {
      state.isSyncing = true;
      state.error = null;
    });
    builder.addCase(performDeltaSync.fulfilled, (state, action: PayloadAction<DeltaSyncResponse>) => {
      state.isSyncing = false;
      state.lastSyncAt = action.payload.lastSyncAt;
      state.pendingChanges = 0;
    });
    builder.addCase(performDeltaSync.rejected, (state, action) => {
      state.isSyncing = false;
      state.error = action.payload as string;
    });

    // Update pending changes count
    builder.addCase(updatePendingChangesCount.fulfilled, (state, action: PayloadAction<number>) => {
      state.pendingChanges = action.payload;
    });

    // Log sync change
    builder.addCase(logSyncChange.fulfilled, (state) => {
      state.pendingChanges += 1;
    });
  },
});