import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, LoginRequest, RegisterRequest, AuthResponse } from '../../types';
import { AuthService } from '../../services/auth/AuthService';
import { StorageUtils } from '../../utils';
import { Config } from '../../constants';

const authService = new AuthService();

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      return await authService.register(userData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const validateToken = createAsyncThunk(
  'auth/validateToken',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      console.log('Validating token...');
      const token = await authService.getStoredToken();
      console.log('Stored token:', token ? 'Found' : 'Not found');

      if (!token) {
        console.log('No token found, user needs to login');
        throw new Error('No token found');
      }

      // Load user data from storage
      console.log('Loading user data from storage...');
      const userData = await StorageUtils.getAsyncStorageItem(Config.storageKeys.userData);
      console.log('Stored user data:', userData ? 'Found' : 'Not found');

      let userObject = null;
      if (userData) {
        const parsedData = JSON.parse(userData);
        console.log('User data parsed:', parsedData);

        // Map the stored data to match User interface
        userObject = {
          id: parsedData.userId || parsedData.id,
          email: parsedData.email,
          name: parsedData.name,
          createdAt: parsedData.createdAt || new Date().toISOString(),
          updatedAt: parsedData.updatedAt || new Date().toISOString(),
        };

        dispatch(setUser(userObject));
      }

      console.log('Validating token with server...');
      const isValid = await authService.validateTokenWithServer();
      console.log('Token validation result:', isValid);

      if (!isValid) {
        console.log('Token is invalid');
        throw new Error('Invalid token');
      }

      console.log('Token is valid');
      return { token, user: userObject };
    } catch (error: any) {
      console.log('Token validation failed:', error.message);
      return rejectWithValue(error.message || 'Token validation failed');
    }
  }
);

export const loadUserData = createAsyncThunk(
  'auth/loadUserData',
  async (_, { rejectWithValue }) => {
    try {
      const userData = await StorageUtils.getAsyncStorageItem(Config.storageKeys.userData);
      if (!userData) {
        throw new Error('No user data found');
      }
      return JSON.parse(userData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load user data');
    }
  }
);

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        const user = {
          id: action.payload.userId,
          email: action.payload.email,
          name: action.payload.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.user = user;
        state.error = null;

        // Store user data in AsyncStorage
        StorageUtils.setAsyncStorageItem(Config.storageKeys.userData, JSON.stringify(user))
          .catch(error => console.warn('Failed to store user data:', error));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        const user = {
          id: action.payload.userId,
          email: action.payload.email,
          name: action.payload.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.user = user;
        state.error = null;

        // Store user data in AsyncStorage
        StorageUtils.setAsyncStorageItem(Config.storageKeys.userData, JSON.stringify(user))
          .catch(error => console.warn('Failed to store user data:', error));
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(validateToken.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(validateToken.fulfilled, (state, action: PayloadAction<{ token: string, user: any }>) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        if (action.payload.user) {
          state.user = action.payload.user;
        }
      })
      .addCase(validateToken.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      .addCase(loadUserData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUserData.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(loadUserData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setUser, clearAuth } = authSlice.actions;

export default authSlice.reducer;