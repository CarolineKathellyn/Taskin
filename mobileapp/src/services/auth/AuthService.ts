import { IAuthService, LoginRequest, RegisterRequest, AuthResponse, TaskinError } from '../../types';
import { Config } from '../../constants';
import { ValidationUtils, StorageUtils, JwtUtils, NetworkUtils } from '../../utils';

export class AuthService implements IAuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = Config.apiBaseUrl;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    ValidationUtils.validateEmail(credentials.email);
    ValidationUtils.validatePassword(credentials.password);

    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TaskinError(
          errorText || 'Erro no login',
          'LOGIN_ERROR',
          response.status
        );
      }

      const authResponse: AuthResponse = await response.json();

      await StorageUtils.setSecureItem(Config.storageKeys.authToken, authResponse.token);
      await StorageUtils.setAsyncStorageItem(
        Config.storageKeys.userData,
        JSON.stringify({
          userId: authResponse.userId,
          email: authResponse.email,
          name: authResponse.name,
        })
      );

      return authResponse;
    } catch (error) {
      if (error instanceof TaskinError) {
        throw error;
      }
      console.error('Login network error:', error);
      throw new TaskinError(`Erro de conexão: ${error instanceof Error ? error.message : 'Verifique se o servidor está rodando'}`, 'NETWORK_ERROR');
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    ValidationUtils.validateRequired(userData.name, 'Nome');
    ValidationUtils.validateEmail(userData.email);
    ValidationUtils.validatePassword(userData.password);

    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TaskinError(
          errorText || 'Erro no cadastro',
          'REGISTER_ERROR',
          response.status
        );
      }

      const authResponse: AuthResponse = await response.json();

      await StorageUtils.setSecureItem(Config.storageKeys.authToken, authResponse.token);
      await StorageUtils.setAsyncStorageItem(
        Config.storageKeys.userData,
        JSON.stringify({
          userId: authResponse.userId,
          email: authResponse.email,
          name: authResponse.name,
        })
      );

      return authResponse;
    } catch (error) {
      if (error instanceof TaskinError) {
        throw error;
      }
      console.error('Register network error:', error);
      throw new TaskinError(`Erro de conexão: ${error instanceof Error ? error.message : 'Verifique se o servidor está rodando'}`, 'NETWORK_ERROR');
    }
  }

  async logout(): Promise<void> {
    try {
      await StorageUtils.removeSecureItem(Config.storageKeys.authToken);
      await StorageUtils.setAsyncStorageItem(Config.storageKeys.userData, '');
      await StorageUtils.setAsyncStorageItem(Config.storageKeys.lastSyncAt, '');
    } catch (error) {
      throw new TaskinError('Erro ao fazer logout', 'LOGOUT_ERROR');
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await StorageUtils.getSecureItem(Config.storageKeys.authToken);
    } catch (error) {
      return null;
    }
  }

  isTokenValid(token: string): boolean {
    try {
      return !JwtUtils.isTokenExpired(token);
    } catch (error) {
      return false;
    }
  }

  async refreshToken(): Promise<string> {
    const currentToken = await this.getStoredToken();

    if (!currentToken) {
      throw new TaskinError('Token não encontrado', 'TOKEN_NOT_FOUND');
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new TaskinError('Token inválido', 'TOKEN_INVALID');
      }

      const result = await response.json();

      if (result.valid) {
        return currentToken;
      } else {
        throw new TaskinError('Token expirado', 'TOKEN_EXPIRED');
      }
    } catch (error) {
      if (error instanceof TaskinError) {
        throw error;
      }
      throw new TaskinError('Erro ao validar token', 'TOKEN_VALIDATION_ERROR');
    }
  }

  async validateTokenWithServer(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      if (!token) return false;

      if (!await NetworkUtils.isConnected()) {
        return this.isTokenValid(token);
      }

      await this.refreshToken();
      return true;
    } catch (error) {
      return false;
    }
  }

  async updateUser(userData: { name: string; email: string }): Promise<{ id: string; email: string; name: string; createdAt: string; updatedAt: string }> {
    const token = await this.getStoredToken();
    if (!token) {
      throw new TaskinError('Token não encontrado', 'TOKEN_NOT_FOUND');
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TaskinError(
          errorText || 'Erro ao atualizar perfil',
          'UPDATE_USER_ERROR',
          response.status
        );
      }

      const userResponse = await response.json();

      // Update stored user data
      await StorageUtils.setAsyncStorageItem(
        Config.storageKeys.userData,
        JSON.stringify({
          userId: userResponse.id,
          email: userResponse.email,
          name: userResponse.name,
        })
      );

      return userResponse;
    } catch (error) {
      if (error instanceof TaskinError) {
        throw error;
      }
      console.error('Update user network error:', error);
      throw new TaskinError(`Erro de conexão: ${error instanceof Error ? error.message : 'Verifique se o servidor está rodando'}`, 'NETWORK_ERROR');
    }
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<void> {
    const token = await this.getStoredToken();
    if (!token) {
      throw new TaskinError('Token não encontrado', 'TOKEN_NOT_FOUND');
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TaskinError(
          errorText || 'Erro ao alterar senha',
          'CHANGE_PASSWORD_ERROR',
          response.status
        );
      }

      // Password change successful - no need to update stored data
    } catch (error) {
      if (error instanceof TaskinError) {
        throw error;
      }
      console.error('Change password network error:', error);
      throw new TaskinError(`Erro de conexão: ${error instanceof Error ? error.message : 'Verifique se o servidor está rodando'}`, 'NETWORK_ERROR');
    }
  }
}