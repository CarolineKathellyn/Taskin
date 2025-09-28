import { Task } from '../types';
import { RecurringTaskService } from './RecurringTaskService';

export class AutoRecurringTaskService {
  /**
   * Processes all tasks and creates necessary recurring instances
   * This should be called on app startup, when returning to foreground, etc.
   */
  static async processRecurringTasks(
    tasks: Task[],
    createTaskCallback: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>
  ): Promise<Task[]> {
    console.log('AutoRecurringTaskService: Processing recurring tasks...');

    const instancesNeeded = RecurringTaskService.getAutomaticInstancesNeeded(tasks);

    if (instancesNeeded.length === 0) {
      console.log('AutoRecurringTaskService: No recurring instances needed');
      return [];
    }

    const createdTasks: Task[] = [];

    for (const { latestTask, instancesToCreate } of instancesNeeded) {
      console.log(`AutoRecurringTaskService: Creating ${instancesToCreate.length} instances for "${latestTask.title}"`);

      for (const instanceData of instancesToCreate) {
        try {
          const createdTask = await createTaskCallback(instanceData);
          createdTasks.push(createdTask);
          console.log(`AutoRecurringTaskService: Created instance due ${instanceData.dueDate} for "${latestTask.title}"`);
        } catch (error) {
          console.error(`AutoRecurringTaskService: Failed to create instance for "${latestTask.title}":`, error);
        }
      }
    }

    console.log(`AutoRecurringTaskService: Created ${createdTasks.length} total recurring task instances`);
    return createdTasks;
  }

  /**
   * Checks if automatic processing should run based on time since last run
   */
  static shouldRunAutomaticProcessing(lastRunTime?: string): boolean {
    if (!lastRunTime) return true;

    const now = new Date();
    const lastRun = new Date(lastRunTime);
    const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);

    // Run if it's been more than 1 hour since last run
    return hoursSinceLastRun >= 1;
  }

  /**
   * Gets summary of what automatic processing would do (for debugging)
   */
  static getProcessingSummary(tasks: Task[]): {
    recurringSeriesCount: number;
    instancesNeeded: number;
    taskSummaries: Array<{
      latestTitle: string;
      pattern: string;
      instancesNeeded: number;
      dueDates: string[];
    }>;
  } {
    const instancesNeeded = RecurringTaskService.getAutomaticInstancesNeeded(tasks);
    const recurringSeries = RecurringTaskService.groupRecurringTasks(tasks);

    return {
      recurringSeriesCount: recurringSeries.length,
      instancesNeeded: instancesNeeded.reduce((sum, item) => sum + item.instancesToCreate.length, 0),
      taskSummaries: instancesNeeded.map(item => ({
        latestTitle: item.latestTask.title,
        pattern: item.latestTask.recurrencePattern || 'unknown',
        instancesNeeded: item.instancesToCreate.length,
        dueDates: item.instancesToCreate.map(instance => instance.dueDate || 'no-date')
      }))
    };
  }
}