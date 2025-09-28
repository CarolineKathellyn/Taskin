import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SyncState } from '../../types';

const initialState: SyncState = {
  lastSyncAt: null,
  isSyncing: false,
  error: null,
  pendingChanges: 0,
};

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
});