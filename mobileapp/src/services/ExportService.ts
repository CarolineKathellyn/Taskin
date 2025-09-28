import { Task, Category, Project } from '../types';
import { DateUtils } from '../utils';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export class ExportService {
  static async exportTasksToCSV(
    tasks: Task[],
    categories: Category[],
    projects: Project[],
    filename: string = 'tasks'
  ): Promise<void> {
    try {
      const csvContent = this.generateCSVContent(tasks, categories, projects);
      const fileUri = `${FileSystem.documentDirectory}${filename}-${DateUtils.getCurrentDateString()}.csv`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar Tarefas',
        });
      } else {
        throw new Error('Compartilhamento não disponível neste dispositivo');
      }
    } catch (error) {
      console.error('Error exporting tasks:', error);
      throw error;
    }
  }

  private static generateCSVContent(
    tasks: Task[],
    categories: Category[],
    projects: Project[]
  ): string {
    // CSV Headers
    const headers = [
      'ID',
      'Título',
      'Descrição',
      'Notas',
      'Prioridade',
      'Status',
      'Progresso (%)',
      'Categoria',
      'Projeto',
      'Data de Vencimento',
      'Data de Criação',
      'Data de Atualização',
      'Data de Conclusão'
    ];

    // Helper functions
    const getCategoryName = (categoryId?: string) => {
      if (!categoryId) return '';
      const category = categories.find(c => c.id === categoryId);
      return category?.name || '';
    };

    const getProjectName = (projectId?: string) => {
      if (!projectId) return '';
      const project = projects.find(p => p.id === projectId);
      return project?.name || '';
    };

    const escapeCSVField = (field: any): string => {
      if (field === null || field === undefined) return '';
      const str = String(field);
      // Escape double quotes and wrap in quotes if contains comma, newline, or quote
      if (str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      if (str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str}"`;
      }
      return str;
    };

    const getPriorityLabel = (priority: string) => {
      const labels = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
      return labels[priority as keyof typeof labels] || priority;
    };

    const getStatusLabel = (status: string) => {
      const labels = {
        pendente: 'Pendente',
        em_progresso: 'Em Progresso',
        concluida: 'Concluída'
      };
      return labels[status as keyof typeof labels] || status;
    };

    // Generate CSV rows
    const rows = tasks.map(task => [
      escapeCSVField(task.id),
      escapeCSVField(task.title),
      escapeCSVField(task.description || ''),
      escapeCSVField(task.notes || ''),
      escapeCSVField(getPriorityLabel(task.priority)),
      escapeCSVField(getStatusLabel(task.status)),
      escapeCSVField(task.progressPercentage),
      escapeCSVField(getCategoryName(task.categoryId)),
      escapeCSVField(getProjectName(task.projectId)),
      escapeCSVField(task.dueDate ? DateUtils.formatDate(task.dueDate) : ''),
      escapeCSVField(DateUtils.formatDate(task.createdAt)),
      escapeCSVField(DateUtils.formatDate(task.updatedAt)),
      escapeCSVField(task.completedAt ? DateUtils.formatDate(task.completedAt) : ''),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  static async exportFilteredTasks(
    tasks: Task[],
    categories: Category[],
    projects: Project[],
    filterDescription: string
  ): Promise<void> {
    const filename = `tasks-filtered-${filterDescription.toLowerCase().replace(/\s+/g, '-')}`;
    await this.exportTasksToCSV(tasks, categories, projects, filename);
  }
}