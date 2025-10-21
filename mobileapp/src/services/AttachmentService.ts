import { TaskAttachment, TaskinError } from '../types';
import { Config } from '../constants';
import { StorageUtils } from '../utils';
import * as FileSystem from 'expo-file-system/legacy';

export class AttachmentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = Config.apiBaseUrl;
  }

  private async getAuthToken(): Promise<string> {
    const token = await StorageUtils.getSecureItem(Config.storageKeys.authToken);
    if (!token) {
      throw new TaskinError('Token de autenticação não encontrado', 'AUTH_ERROR');
    }
    return token;
  }

  /**
   * Upload file to server
   */
  async uploadFile(taskId: string, fileUri: string, fileName: string, fileType: 'image' | 'document'): Promise<TaskAttachment> {
    try {
      const token = await this.getAuthToken();

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new TaskinError('Arquivo não encontrado', 'FILE_NOT_FOUND');
      }

      // Create form data
      const formData = new FormData();

      // Read file and append to form data
      const file = {
        uri: fileUri,
        name: fileName,
        type: this.getMimeType(fileName, fileType),
      } as any;

      formData.append('file', file);
      formData.append('taskId', taskId);
      formData.append('fileType', fileType);

      const response = await fetch(`${this.baseUrl}/attachments/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TaskinError(
          errorText || 'Erro ao fazer upload do arquivo',
          'UPLOAD_ERROR',
          response.status
        );
      }

      const attachment: TaskAttachment = await response.json();
      return attachment;

    } catch (error) {
      if (error instanceof TaskinError) {
        throw error;
      }
      console.error('Upload error:', error);
      throw new TaskinError(
        `Erro ao fazer upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'UPLOAD_ERROR'
      );
    }
  }

  /**
   * Add link as attachment
   */
  async addLink(taskId: string, url: string, name?: string): Promise<TaskAttachment> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/attachments/link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          url,
          name: name || url,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TaskinError(
          errorText || 'Erro ao adicionar link',
          'ADD_LINK_ERROR',
          response.status
        );
      }

      const attachment: TaskAttachment = await response.json();
      return attachment;

    } catch (error) {
      if (error instanceof TaskinError) {
        throw error;
      }
      console.error('Add link error:', error);
      throw new TaskinError(
        `Erro ao adicionar link: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'ADD_LINK_ERROR'
      );
    }
  }

  /**
   * Get all attachments for a task
   */
  async getAttachmentsByTaskId(taskId: string): Promise<TaskAttachment[]> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/attachments/task/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TaskinError(
          errorText || 'Erro ao buscar anexos',
          'GET_ATTACHMENTS_ERROR',
          response.status
        );
      }

      const attachments: TaskAttachment[] = await response.json();
      return attachments;

    } catch (error) {
      if (error instanceof TaskinError) {
        throw error;
      }
      console.error('Get attachments error:', error);
      throw new TaskinError(
        `Erro ao buscar anexos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'GET_ATTACHMENTS_ERROR'
      );
    }
  }

  /**
   * Download file from server
   */
  async downloadFile(attachmentId: string, fileName: string): Promise<string> {
    try {
      const token = await this.getAuthToken();

      const downloadUrl = `${this.baseUrl}/attachments/${attachmentId}/download`;
      const fileUri = FileSystem.documentDirectory + fileName;

      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (downloadResult.status !== 200) {
        throw new TaskinError('Erro ao baixar arquivo', 'DOWNLOAD_ERROR', downloadResult.status);
      }

      return downloadResult.uri;

    } catch (error) {
      if (error instanceof TaskinError) {
        throw error;
      }
      console.error('Download error:', error);
      throw new TaskinError(
        `Erro ao baixar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'DOWNLOAD_ERROR'
      );
    }
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TaskinError(
          errorText || 'Erro ao deletar anexo',
          'DELETE_ERROR',
          response.status
        );
      }

    } catch (error) {
      if (error instanceof TaskinError) {
        throw error;
      }
      console.error('Delete attachment error:', error);
      throw new TaskinError(
        `Erro ao deletar anexo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'DELETE_ERROR'
      );
    }
  }

  /**
   * Get MIME type based on file extension
   */
  private getMimeType(fileName: string, fileType: 'image' | 'document'): string {
    const extension = fileName.toLowerCase().split('.').pop();

    if (fileType === 'image') {
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'gif':
          return 'image/gif';
        default:
          return 'image/jpeg';
      }
    } else {
      switch (extension) {
        case 'pdf':
          return 'application/pdf';
        case 'doc':
          return 'application/msword';
        case 'docx':
          return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'xls':
          return 'application/vnd.ms-excel';
        case 'xlsx':
          return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'txt':
          return 'text/plain';
        default:
          return 'application/octet-stream';
      }
    }
  }
}

export default new AttachmentService();
