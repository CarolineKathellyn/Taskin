import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Task, Project, Category } from '../types';
import { DateUtils } from '../utils';
import { TaskPriorities, TaskStatuses, getCategoryById } from '../constants';

export interface ExportOptions {
  fileName?: string;
  includeCompletedTasks?: boolean;
  includePendingTasks?: boolean;
  includeInProgressTasks?: boolean;
  projectId?: string;
  categoryId?: string;
  dateRange?: 'all' | 'today' | 'this_week' | 'this_month';
}

export class HTMLExportService {
  private static generateHTML(
    tasks: Task[],
    projects: Project[],
    options: ExportOptions,
    userInfo: { name: string; email: string }
  ): string {
    const reportDate = new Date().toLocaleDateString('pt-BR');
    const reportTime = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Filter tasks based on options
    let filteredTasks = tasks.filter(task => {
      // Status filter
      if (!options.includeCompletedTasks && task.status === 'concluida') return false;
      if (!options.includePendingTasks && task.status === 'pendente') return false;
      if (!options.includeInProgressTasks && task.status === 'em_progresso') return false;

      // Project filter
      if (options.projectId && task.projectId !== options.projectId) return false;

      // Category filter
      if (options.categoryId && task.categoryId !== options.categoryId) return false;

      // Date range filter
      if (options.dateRange && options.dateRange !== 'all') {
        const taskDate = new Date(task.dueDate);
        const now = new Date();

        switch (options.dateRange) {
          case 'today':
            if (!DateUtils.isSameDay(taskDate, now)) return false;
            break;
          case 'this_week':
            if (!DateUtils.isThisWeek(taskDate)) return false;
            break;
          case 'this_month':
            if (!DateUtils.isThisMonth(taskDate)) return false;
            break;
        }
      }

      return true;
    });

    // Group tasks by project
    const tasksByProject = filteredTasks.reduce((acc, task) => {
      const projectId = task.projectId || 'no-project';
      if (!acc[projectId]) {
        acc[projectId] = [];
      }
      acc[projectId].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    // Generate project summary
    const projectSummaries = Object.entries(tasksByProject).map(([projectId, projectTasks]) => {
      const project = projects.find(p => p.id === projectId);
      const completedTasks = projectTasks.filter(t => t.status === 'concluida').length;
      const totalTasks = projectTasks.length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        project,
        tasks: projectTasks,
        completedTasks,
        totalTasks,
        progress
      };
    });

    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === 'concluida').length;
    const overdueTasks = filteredTasks.filter(t => {
      return t.status !== 'concluida' && DateUtils.isOverdue(t.dueDate);
    }).length;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Tarefas - Taskin</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.6;
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007AFF;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007AFF;
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header .subtitle {
            color: #666;
            margin: 5px 0 0 0;
            font-size: 14px;
        }
        .report-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #007AFF;
        }
        .report-info h3 {
            margin-top: 0;
            color: #007AFF;
            font-size: 18px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: linear-gradient(135deg, #007AFF, #5AC8FA);
            color: white;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,122,255,0.3);
        }
        .summary-card h4 {
            margin: 0 0 10px 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .summary-card .number {
            font-size: 32px;
            font-weight: bold;
            margin: 0;
        }
        .project-section {
            margin-bottom: 40px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .project-header {
            background: linear-gradient(135deg, #007AFF, #5AC8FA);
            color: white;
            padding: 20px;
            margin-bottom: 0;
        }
        .project-header h3 {
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 20px;
        }
        .project-progress {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #e0e0e0;
        }
        .progress-bar {
            background: #e0e0e0;
            height: 10px;
            border-radius: 5px;
            overflow: hidden;
            margin: 8px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #34C759, #30D158);
            border-radius: 5px;
            transition: width 0.3s ease;
        }
        .task-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }
        .task-table th,
        .task-table td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #f0f0f0;
        }
        .task-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #333;
            font-size: 14px;
        }
        .task-table tr:hover {
            background: #f8f9fa;
        }
        .badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            color: white;
            display: inline-block;
        }
        .priority-baixa { background: #34C759; }
        .priority-media { background: #FF9500; }
        .priority-alta { background: #FF3B30; }
        .status-pendente { background: #8E8E93; }
        .status-em_progresso { background: #5AC8FA; }
        .status-concluida { background: #34C759; }
        .overdue {
            color: #FF3B30;
            font-weight: bold;
        }
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #8E8E93;
            font-style: italic;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #8E8E93;
            font-size: 12px;
        }
        @media (max-width: 600px) {
            .container { margin: 10px; padding: 20px; }
            .summary { grid-template-columns: 1fr 1fr; }
            .task-table { font-size: 14px; }
            .task-table th, .task-table td { padding: 10px 8px; }
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Relatório de Tarefas</h1>
            <p class="subtitle">Taskin - Gerenciador de Tarefas</p>
        </div>

        <div class="report-info">
            <h3>📊 Informações do Relatório</h3>
            <p><strong>Usuário:</strong> ${userInfo.name} (${userInfo.email})</p>
            <p><strong>Gerado em:</strong> ${reportDate} às ${reportTime}</p>
            <p><strong>Total de tarefas:</strong> ${totalTasks}</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h4>Total de Tarefas</h4>
                <div class="number">${totalTasks}</div>
            </div>
            <div class="summary-card">
                <h4>Concluídas</h4>
                <div class="number">${completedTasks}</div>
            </div>
            <div class="summary-card">
                <h4>Em Atraso</h4>
                <div class="number">${overdueTasks}</div>
            </div>
            <div class="summary-card">
                <h4>Taxa de Conclusão</h4>
                <div class="number">${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</div>
            </div>
        </div>

        ${projectSummaries.map(summary => `
            <div class="project-section">
                <div class="project-header">
                    <h3>
                        ${summary.project ? `📁 ${summary.project.name}` : '📝 Tarefas sem projeto'}
                    </h3>
                </div>
                <div class="project-progress">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <span><strong>Progresso:</strong> ${summary.completedTasks} de ${summary.totalTasks} tarefas</span>
                        <span><strong>${summary.progress}%</strong></span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${summary.progress}%"></div>
                    </div>
                </div>

                ${summary.tasks.length > 0 ? `
                    <table class="task-table">
                        <thead>
                            <tr>
                                <th>Tarefa</th>
                                <th>Status</th>
                                <th>Prioridade</th>
                                <th>Vencimento</th>
                                <th>Progresso</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${summary.tasks.map(task => {
                              const isOverdue = task.status !== 'concluida' && DateUtils.isOverdue(task.dueDate);
                              const category = task.categoryId ? getCategoryById(task.categoryId) : null;

                              return `
                                <tr>
                                    <td>
                                        <strong>${task.title}</strong>
                                        ${task.description ? `<br><small style="color: #666;">${task.description}</small>` : ''}
                                        ${category ? `<br><small style="color: ${category.color};">📂 ${category.name}</small>` : ''}
                                    </td>
                                    <td>
                                        <span class="badge status-${task.status}">${TaskStatuses[task.status].label}</span>
                                    </td>
                                    <td>
                                        <span class="badge priority-${task.priority}">${TaskPriorities[task.priority].label}</span>
                                    </td>
                                    <td class="${isOverdue ? 'overdue' : ''}">
                                        ${DateUtils.formatDate(task.dueDate)}
                                        ${isOverdue ? '<br><small>(Em atraso)</small>' : ''}
                                    </td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <div style="flex: 1; background: #e0e0e0; height: 6px; border-radius: 3px;">
                                                <div style="width: ${task.progressPercentage}%; height: 100%; background: #007AFF; border-radius: 3px;"></div>
                                            </div>
                                            <span style="font-size: 12px; color: #666;">${task.progressPercentage}%</span>
                                        </div>
                                    </td>
                                </tr>
                              `;
                            }).join('')}
                        </tbody>
                    </table>
                ` : '<div class="empty-state">Nenhuma tarefa encontrada para este projeto.</div>'}
            </div>
        `).join('')}

        <div class="footer">
            <p><strong>Taskin</strong> - Relatório gerado em ${reportDate} às ${reportTime}</p>
            <p>Este documento contém ${totalTasks} tarefa(s) filtrada(s) de acordo com os critérios selecionados.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  static async exportToHTML(
    tasks: Task[],
    projects: Project[],
    userInfo: { name: string; email: string },
    options: ExportOptions = {}
  ): Promise<string> {
    try {
      const fileName = options.fileName || `taskin-relatorio-${new Date().toISOString().split('T')[0]}.html`;

      // Generate HTML content
      const htmlContent = this.generateHTML(tasks, projects, options, userInfo);

      // Save HTML file
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      console.log('HTML report generated successfully:', fileUri);
      return fileUri;
    } catch (error) {
      console.error('Error generating HTML report:', error);
      throw new Error(`Erro ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async shareHTML(filePath: string): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        throw new Error('Compartilhamento não está disponível neste dispositivo');
      }

      await Sharing.shareAsync(filePath, {
        mimeType: 'text/html',
        dialogTitle: 'Compartilhar Relatório de Tarefas',
      });

      console.log('HTML report shared successfully');
    } catch (error) {
      console.error('Error sharing HTML report:', error);
      throw new Error(`Erro ao compartilhar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async exportAndShare(
    tasks: Task[],
    projects: Project[],
    userInfo: { name: string; email: string },
    options: ExportOptions = {}
  ): Promise<void> {
    try {
      console.log('Starting HTML export and share...');
      const filePath = await this.exportToHTML(tasks, projects, userInfo, options);
      await this.shareHTML(filePath);
      console.log('HTML export and share completed successfully');
    } catch (error) {
      console.error('Error in export and share process:', error);
      throw error;
    }
  }
}

export default HTMLExportService;