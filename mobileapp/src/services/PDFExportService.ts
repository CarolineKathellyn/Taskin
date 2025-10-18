import { printToFileAsync } from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Task, Project, Category } from '../types';
import { DateUtils } from '../utils';
import { TaskPriorities, TaskStatuses, getCategoryById } from '../constants';

export interface PDFExportOptions {
  fileName?: string;
  includeCompletedTasks?: boolean;
  includePendingTasks?: boolean;
  includeInProgressTasks?: boolean;
  projectId?: string;
  categoryId?: string;
  dateRange?: 'all' | 'today' | 'this_week' | 'this_month';
}

export class PDFExportService {
  private static generateHTML(
    tasks: Task[],
    projects: Project[],
    options: PDFExportOptions,
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
    <title>Relatório de Tarefas - Taskin</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
            line-height: 1.6;
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
        }
        .header .subtitle {
            color: #666;
            margin: 5px 0 0 0;
            font-size: 14px;
        }
        .report-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        .report-info h3 {
            margin-top: 0;
            color: #007AFF;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        .summary-card h4 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
        }
        .summary-card .number {
            font-size: 24px;
            font-weight: bold;
            color: #007AFF;
        }
        .project-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        .project-header {
            background: #007AFF;
            color: white;
            padding: 15px;
            border-radius: 8px 8px 0 0;
            margin-bottom: 0;
        }
        .project-header h3 {
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .project-progress {
            background: #f8f9fa;
            padding: 10px 15px;
            border: 1px solid #e0e0e0;
            border-top: none;
        }
        .progress-bar {
            background: #e0e0e0;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
            margin: 5px 0;
        }
        .progress-fill {
            height: 100%;
            background: #34C759;
            transition: width 0.3s ease;
        }
        .task-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .task-table th,
        .task-table td {
            border: 1px solid #e0e0e0;
            padding: 10px;
            text-align: left;
        }
        .task-table th {
            background: #f8f9fa;
            font-weight: bold;
            color: #333;
        }
        .task-table tr:nth-child(even) {
            background: #f9f9f9;
        }
        .priority {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
            color: white;
            text-transform: uppercase;
        }
        .priority.baixa { background: #34C759; }
        .priority.media { background: #FF9500; }
        .priority.alta { background: #FF3B30; }
        .status {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
            color: white;
            text-transform: uppercase;
        }
        .status.pendente { background: #6D6D80; }
        .status.em_progresso { background: #5AC8FA; }
        .status.concluida { background: #34C759; }
        .overdue {
            color: #FF3B30;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { margin: 20px; }
            .project-section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Relatório de Tarefas</h1>
        <p class="subtitle">Taskin - Gerenciador de Tarefas</p>
    </div>

    <div class="report-info">
        <h3>Informações do Relatório</h3>
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
                <div style="display: flex; justify-content: space-between; align-items: center;">
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
                            <th>Data de Vencimento</th>
                            <th>Progresso</th>
                            <th>Categoria</th>
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
                                </td>
                                <td>
                                    <span class="status ${task.status}">${TaskStatuses[task.status].label}</span>
                                </td>
                                <td>
                                    <span class="priority ${task.priority}">${TaskPriorities[task.priority].label}</span>
                                </td>
                                <td class="${isOverdue ? 'overdue' : ''}">
                                    ${DateUtils.formatDate(task.dueDate)}
                                    ${isOverdue ? '<br><small>(Em atraso)</small>' : ''}
                                </td>
                                <td>${task.progressPercentage}%</td>
                                <td>${category ? category.name : '-'}</td>
                            </tr>
                          `;
                        }).join('')}
                    </tbody>
                </table>
            ` : '<p><em>Nenhuma tarefa encontrada para este projeto.</em></p>'}
        </div>
    `).join('')}

    <div class="footer">
        <p>Relatório gerado pelo Taskin • ${reportDate} ${reportTime}</p>
        <p>Este documento contém ${totalTasks} tarefa(s) filtrada(s) de acordo com os critérios selecionados.</p>
    </div>
</body>
</html>
    `.trim();
  }

  static async exportToPDF(
    tasks: Task[],
    projects: Project[],
    userInfo: { name: string; email: string },
    options: PDFExportOptions = {}
  ): Promise<string> {
    try {
      const fileName = options.fileName || `taskin-tasks-${new Date().toISOString().split('T')[0]}.pdf`;

      // Generate HTML content
      const htmlContent = this.generateHTML(tasks, projects, options, userInfo);

      // Convert HTML to PDF using expo-print
      const { uri } = await printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      if (!uri) {
        throw new Error('Failed to generate PDF file');
      }

      // Move the file to a more accessible location
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.moveAsync({
        from: uri,
        to: fileUri,
      });

      console.log('PDF generated successfully:', fileUri);
      return fileUri;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async sharePDF(filePath: string): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        throw new Error('Compartilhamento não está disponível neste dispositivo');
      }

      await Sharing.shareAsync(filePath, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartilhar Relatório de Tarefas',
      });

      console.log('PDF shared successfully');
    } catch (error) {
      console.error('Error sharing PDF:', error);
      throw new Error(`Erro ao compartilhar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async exportAndShare(
    tasks: Task[],
    projects: Project[],
    userInfo: { name: string; email: string },
    options: PDFExportOptions = {}
  ): Promise<void> {
    try {
      console.log('Starting PDF export and share...');
      const filePath = await this.exportToPDF(tasks, projects, userInfo, options);
      await this.sharePDF(filePath);
      console.log('PDF export and share completed successfully');
    } catch (error) {
      console.error('Error in export and share process:', error);
      throw error;
    }
  }
}

export default PDFExportService;