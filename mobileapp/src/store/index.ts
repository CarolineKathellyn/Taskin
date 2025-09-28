import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from './slices/authSlice';
import { taskSlice } from './slices/taskSlice';
import { syncSlice } from './slices/syncSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    tasks: taskSlice.reducer,
    sync: syncSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;