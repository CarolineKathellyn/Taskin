import { ISyncService, SyncRequest, SyncResponse, TaskinError } from '../../types';
import { Config } from '../../constants';
import { StorageUtils, NetworkUtils } from '../../utils';
import { DatabaseService } from '../database/DatabaseService';

export class SyncService implements ISyncService {
  private baseUrl: string;
  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.baseUrl = Config.apiBaseUrl;
    this.databaseService = databaseService;
  }

  async uploadDatabase(): Promise<SyncResponse> {
    const isConnected = await NetworkUtils.isConnected();
    if (!isConnected) {
      throw new TaskinError('Sem conexão com a internet', 'NO_CONNECTION');
    }

    const token = await StorageUtils.getSecureItem(Config.storageKeys.authToken);
    if (!token) {
      throw new TaskinError('Token de autenticação não encontrado', 'NO_AUTH_TOKEN');
    }

    try {
      const taskDatabase = await this.databaseService.exportDatabase();
      const lastSyncAt = await StorageUtils.getAsyncStorageItem(Config.storageKeys.lastSyncAt);

      const syncRequest: SyncRequest = {
        taskDatabase,
        lastSyncAt: lastSyncAt || undefined,
      };

      const response = await fetch(`${this.baseUrl}/sync/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(syncRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TaskinError(
          errorText || 'Erro ao enviar dados',
          'UPLOAD_ERROR',
          response.status
        );
      }

      const syncResponse: SyncResponse = await response.json();

      if (syncResponse.lastSyncAt) {
        await StorageUtils.setAsyncStorageItem(Config.storageKeys.lastSyncAt, syncResponse.lastSyncAt);
      }

      return syncResponse;
    } catch (error) {
      if (error instanceof TaskinError) {
        throw error;
      }
      throw new TaskinError('Erro de conexão ao enviar dados', 'NETWORK_ERROR');
    }
  }

  async downloadDatabase(): Promise<SyncResponse> {
    const isConnected = await NetworkUtils.isConnected();
    if (!isConnected) {
      throw new TaskinError('Sem conexão com a internet', 'NO_CONNECTION');
    }

    const token = await StorageUtils.getSecureItem(Config.storageKeys.authToken);
    if (!token) {
      throw new TaskinError('Token de autenticação não encontrado', 'NO_AUTH_TOKEN');
    }

    try {
      const response = await fetch(`${this.baseUrl}/sync/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TaskinError(
          errorText || 'Erro ao baixar dados',
          'DOWNLOAD_ERROR',
          response.status
        );
      }

      const syncResponse: SyncResponse = await response.json();

      if (syncResponse.taskDatabase) {
        await this.databaseService.importDatabase(syncResponse.taskDatabase);
      }

      if (syncResponse.lastSyncAt) {
        await StorageUtils.setAsyncStorageItem(Config.storageKeys.lastSyncAt, syncResponse.lastSyncAt);
      }

      return syncResponse;
    } catch (error) {
      if (error instanceof TaskinError) {
        throw error;
      }
      throw new TaskinError('Erro de conexão ao baixar dados', 'NETWORK_ERROR');
    }
  }

  async getSyncStatus(): Promise<any> {
    const isConnected = await NetworkUtils.isConnected();
    if (!isConnected) {
      return {
        connected: false,
        lastSyncAt: await StorageUtils.getAsyncStorageItem(Config.storageKeys.lastSyncAt),
        pendingSync: true,
      };
    }

    const token = await StorageUtils.getSecureItem(Config.storageKeys.authToken);
    if (!token) {
      throw new TaskinError('Token de autenticação não encontrado', 'NO_AUTH_TOKEN');
    }

    try {
      const response = await fetch(`${this.baseUrl}/sync/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new TaskinError('Erro ao verificar status de sincronização', 'SYNC_STATUS_ERROR');
      }

      const status = await response.json();
      const lastSyncAt = await StorageUtils.getAsyncStorageItem(Config.storageKeys.lastSyncAt);

      return {
        connected: true,
        lastSyncAt,
        serverLastSync: status.lastSyncAt,
        pendingSync: !lastSyncAt || lastSyncAt !== status.lastSyncAt,
        ...status,
      };
    } catch (error) {
      if (error instanceof TaskinError) {
        throw error;
      }
      throw new TaskinError('Erro de conexão ao verificar status', 'NETWORK_ERROR');
    }
  }

  async autoSync(): Promise<void> {
    try {
      const isConnected = await NetworkUtils.isConnected();
      if (!isConnected) {
        console.log('Sem conexão - pulando sincronização automática');
        return;
      }

      const status = await this.getSyncStatus();

      if (status.pendingSync) {
        console.log('Iniciando sincronização automática...');

        await this.uploadDatabase();
        console.log('Upload concluído');

        await this.downloadDatabase();
        console.log('Download concluído');

        console.log('Sincronização automática concluída');
      } else {
        console.log('Nenhuma sincronização necessária');
      }
    } catch (error) {
      console.warn('Erro na sincronização automática:', error);
    }
  }

  async forceBidirectionalSync(): Promise<SyncResponse> {
    await this.uploadDatabase();
    return await this.downloadDatabase();
  }

  async scheduledSync(): Promise<void> {
    const lastAutoSync = await StorageUtils.getAsyncStorageItem('last_auto_sync');
    const now = Date.now();
    const shouldSync = !lastAutoSync ||
      (now - parseInt(lastAutoSync)) > Config.autoSyncInterval;

    if (shouldSync) {
      await this.autoSync();
      await StorageUtils.setAsyncStorageItem('last_auto_sync', now.toString());
    }
  }
}