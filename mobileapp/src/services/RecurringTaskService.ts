import { Task } from '../types';
import { DateUtils, StringUtils } from '../utils';

export class RecurringTaskService {
  /**
   * Creates a new task instance from a recurring task template
   */
  static createRecurringInstance(originalTask: Task, newDueDate?: string): Omit<Task, 'id' | 'createdAt' | 'updatedAt'> {
    const now = DateUtils.getCurrentISOString();

    // Calculate next due date if not provided
    let nextDueDate = newDueDate;
    if (!nextDueDate) {
      nextDueDate = this.calculateNextDueDate(originalTask.dueDate, originalTask.recurrencePattern!);
    }

    // Ensure we always have a valid due date (fallback to current date if calculation fails)
    if (!nextDueDate) {
      console.warn('RecurringTaskService: Could not calculate due date, using current date as fallback');
      nextDueDate = now.split('T')[0]; // Use today's date as fallback
    }

    return {
      title: originalTask.title,
      description: originalTask.description,
      notes: originalTask.notes,
      priority: originalTask.priority,
      status: 'pendente', // Reset status for new instance
      dueDate: nextDueDate, // Now guaranteed to be a string
      categoryId: originalTask.categoryId,
      projectId: originalTask.projectId,
      progressPercentage: 0, // Reset progress for new instance
      userId: originalTask.userId,
      completedAt: undefined, // Reset completion
      isRecurring: true, // Keep recurring flag so UI shows the recurring tag
      recurrencePattern: originalTask.recurrencePattern, // Keep pattern for display
      parentTaskId: originalTask.id, // Link to parent recurring task
    };
  }

  /**
   * Calculates the next due date based on recurrence pattern
   */
  static calculateNextDueDate(currentDueDate: string, pattern: 'daily' | 'weekly' | 'monthly'): string {
    const date = new Date(currentDueDate);

    switch (pattern) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        // Handle month boundaries correctly
        const currentDay = date.getDate();
        date.setMonth(date.getMonth() + 1);

        // If the original day doesn't exist in the new month (e.g., Jan 31 -> Feb 31),
        // set it to the last day of the month
        if (date.getDate() !== currentDay) {
          date.setDate(0); // Sets to last day of previous month
        }
        break;
      default:
        throw new Error(`Unsupported recurrence pattern: ${pattern}`);
    }

    // Return just the date part (YYYY-MM-DD) for consistency
    return date.toISOString().split('T')[0];
  }

  /**
   * Checks if a new recurring instance should be created
   * This should be called when a recurring task is completed
   */
  static shouldCreateNextInstance(task: Task): boolean {
    return !!(
      task.isRecurring &&
      task.recurrencePattern &&
      task.status === 'concluida' &&
      !task.parentTaskId // Only create instances from parent tasks, not from instances
    );
  }

  /**
   * Gets the display label for recurrence pattern
   */
  static getRecurrenceLabel(pattern?: 'daily' | 'weekly' | 'monthly'): string {
    switch (pattern) {
      case 'daily': return 'Diário';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      default: return '';
    }
  }

  /**
   * Checks if a due date is overdue for a recurring task
   * and calculates how many instances might be missed
   */
  static calculateMissedInstances(task: Task): number {
    if (!task.isRecurring || !task.dueDate || !task.recurrencePattern) {
      return 0;
    }

    const now = new Date();
    const dueDate = new Date(task.dueDate);

    if (dueDate >= now) {
      return 0; // Not overdue
    }

    const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    switch (task.recurrencePattern) {
      case 'daily':
        return daysDiff;
      case 'weekly':
        return Math.floor(daysDiff / 7);
      case 'monthly':
        // Approximate calculation for months
        return Math.floor(daysDiff / 30);
      default:
        return 0;
    }
  }

  /**
   * Creates multiple instances for missed recurring tasks
   */
  static createMissedInstances(task: Task, count: number): Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> {
    if (!task.isRecurring || !task.dueDate || !task.recurrencePattern || count <= 0) {
      return [];
    }

    const instances: Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> = [];
    let currentDueDate = task.dueDate;

    for (let i = 0; i < count; i++) {
      const nextDueDate = this.calculateNextDueDate(currentDueDate, task.recurrencePattern);
      const instance = this.createRecurringInstance(task, nextDueDate);
      instances.push(instance);
      currentDueDate = nextDueDate;
    }

    return instances;
  }

  /**
   * Checks if a recurring task should have new instances created automatically
   * based on its due date and recurrence pattern
   */
  static shouldCreateAutomaticInstances(task: Task, existingTasks: Task[]): boolean {
    if (!task.isRecurring || !task.dueDate || !task.recurrencePattern || task.parentTaskId) {
      return false;
    }

    const today = DateUtils.getCurrentDateStringBrazil();
    const taskDueDate = task.dueDate;

    // Check if the task's due date has passed or is today
    const isOverdue = new Date(taskDueDate) <= new Date(today);

    if (!isOverdue) {
      return false;
    }

    // Check if we already have an instance for the next occurrence
    const nextDueDate = this.calculateNextDueDate(taskDueDate, task.recurrencePattern);
    const hasNextInstance = existingTasks.some(t =>
      t.parentTaskId === task.id &&
      t.dueDate === nextDueDate
    );

    return !hasNextInstance;
  }

  /**
   * Gets all recurring task instances that should be automatically created
   */
  static getAutomaticInstancesNeeded(tasks: Task[]): Array<{
    latestTask: Task;
    instancesToCreate: Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>;
  }> {
    // Group all recurring tasks by their recurring series
    const recurringGroups = this.groupRecurringTasks(tasks);

    const results: Array<{
      latestTask: Task;
      instancesToCreate: Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>;
    }> = [];

    recurringGroups.forEach(group => {
      // Use the latest task in the series (most recent due date)
      const latestTask = group[group.length - 1];

      if (!latestTask.dueDate || !latestTask.recurrencePattern) return;

      const today = DateUtils.getCurrentDateStringBrazil();
      const instances = this.calculateNeededInstancesFromLatest(latestTask, tasks, today);

      if (instances.length > 0) {
        results.push({
          latestTask,
          instancesToCreate: instances
        });
      }
    });

    return results;
  }

  /**
   * Checks if we should create the next instance when a recurring task is completed manually.
   * This prevents duplicate creation when automatic generation already created the next instance.
   */
  static shouldCreateNextInstance(task: Task, existingTasks?: Task[]): boolean {
    // Only create on manual completion if:
    // 1. Task is recurring
    // 2. Task is now completed
    // 3. Task has recurrence pattern
    // 4. Task has due date
    if (!task.isRecurring || task.status !== 'concluida' || !task.recurrencePattern || !task.dueDate) {
      return false;
    }

    // If we have access to existing tasks, check if next instance already exists
    if (existingTasks) {
      const nextDueDate = this.calculateNextDueDate(task.dueDate, task.recurrencePattern);
      const seriesId = task.parentTaskId || task.id;

      // Check if there's already a task for the next due date in this series
      const existingNextInstance = existingTasks.find(t =>
        t.isRecurring &&
        (t.parentTaskId === seriesId || (t.id === seriesId && t.id !== task.id)) &&
        t.dueDate === nextDueDate &&
        t.status !== 'concluida'
      );

      if (existingNextInstance) {
        console.log('Next recurring instance already exists, skipping creation');
        return false;
      }
    }

    // For safety, disable manual creation for now since automatic creation should handle all cases
    console.log('Manual recurring task creation disabled to prevent duplicates');
    return false;
  }

  /**
   * Groups recurring tasks by their series (parent + all instances)
   */
  static groupRecurringTasks(tasks: Task[]): Task[][] {
    const groups: Task[][] = [];
    const processedTaskIds = new Set<string>();

    tasks.forEach(task => {
      if (!task.isRecurring || processedTaskIds.has(task.id)) return;

      // Find all tasks in this recurring series
      const seriesId = task.parentTaskId || task.id; // Use parent ID or own ID
      const seriesTasks = tasks.filter(t =>
        t.isRecurring && (
          t.id === seriesId ||
          t.parentTaskId === seriesId
        )
      );

      // Sort by due date to get chronological order
      seriesTasks.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      if (seriesTasks.length > 0) {
        groups.push(seriesTasks);
        seriesTasks.forEach(t => processedTaskIds.add(t.id));
      }
    });

    return groups;
  }

  /**
   * Calculates how many instances are needed from the latest task in a series
   */
  static calculateNeededInstancesFromLatest(
    latestTask: Task,
    allTasks: Task[],
    today: string
  ): Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> {
    if (!latestTask.dueDate || !latestTask.recurrencePattern) {
      return [];
    }

    const instances: Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> = [];

    // Find all existing tasks in this series to avoid duplicates
    const seriesId = latestTask.parentTaskId || latestTask.id;
    const existingInstances = allTasks.filter(t =>
      t.isRecurring && (
        t.id === seriesId ||
        t.parentTaskId === seriesId
      )
    );

    // Start from the NEXT due date after the latest task
    let currentDueDate = this.calculateNextDueDate(latestTask.dueDate, latestTask.recurrencePattern);
    const todayDate = new Date(today);

    // Generate instances for today and overdue dates (for testing)
    // Add days based on pattern for testing - this will create next instance today
    const testDate = new Date(todayDate);
    const daysToAdd = latestTask.recurrencePattern === 'daily' ? 1 :
                     latestTask.recurrencePattern === 'weekly' ? 7 : 30;
    testDate.setDate(testDate.getDate() + daysToAdd);

    console.log(`RecurringTaskService: Calculating instances from latest "${latestTask.title}"`, {
      latestDueDate: latestTask.dueDate,
      nextDueDate: currentDueDate,
      today: today,
      pattern: latestTask.recurrencePattern
    });

    while (new Date(currentDueDate) <= testDate) {
      // Check if we already have an instance for this due date
      const hasInstanceForDate = existingInstances.some(instance =>
        instance.dueDate === currentDueDate
      );

      if (!hasInstanceForDate) {
        const instance = this.createRecurringInstance(latestTask, currentDueDate);
        instances.push(instance);
        console.log(`RecurringTaskService: Will create instance for ${currentDueDate}`);
      } else {
        console.log(`RecurringTaskService: Instance already exists for ${currentDueDate}`);
      }

      // Calculate next due date
      currentDueDate = this.calculateNextDueDate(currentDueDate, latestTask.recurrencePattern);

      // Safety check to avoid infinite loops
      if (instances.length > 100) {
        console.warn('Too many recurring instances to create, stopping at 100');
        break;
      }
    }

    console.log(`RecurringTaskService: Will create ${instances.length} instances from latest "${latestTask.title}"`);
    return instances;
  }

  /**
   * Calculates how many instances are needed for a recurring task (legacy method)
   */
  static calculateNeededInstances(
    parentTask: Task,
    allTasks: Task[],
    today: string
  ): Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> {
    if (!parentTask.dueDate || !parentTask.recurrencePattern) {
      return [];
    }

    const instances: Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> = [];
    const existingInstances = allTasks.filter(t => t.parentTaskId === parentTask.id);

    // Start from the NEXT due date, not the original due date
    // This prevents creating a duplicate of the original task
    let currentDueDate = this.calculateNextDueDate(parentTask.dueDate, parentTask.recurrencePattern);
    const todayDate = new Date(today);

    console.log(`RecurringTaskService: Calculating instances for "${parentTask.title}"`, {
      originalDueDate: parentTask.dueDate,
      nextDueDate: currentDueDate,
      today: today,
      pattern: parentTask.recurrencePattern
    });

    // Generate instances for today and overdue dates (for testing)
    // Add days based on pattern for testing - this will create next instance today
    const testDate = new Date(todayDate);
    const daysToAdd = parentTask.recurrencePattern === 'daily' ? 1 :
                     parentTask.recurrencePattern === 'weekly' ? 7 : 30;
    testDate.setDate(testDate.getDate() + daysToAdd);

    console.log(`RecurringTaskService: Testing with date ${testDate.toISOString().split('T')[0]} (added ${daysToAdd} days)`);

    while (new Date(currentDueDate) <= testDate) {
      // Check if we already have an instance for this due date
      const hasInstanceForDate = existingInstances.some(instance =>
        instance.dueDate === currentDueDate
      );

      if (!hasInstanceForDate) {
        const instance = this.createRecurringInstance(parentTask, currentDueDate);
        instances.push(instance);
        console.log(`RecurringTaskService: Will create instance for ${currentDueDate}`);
      } else {
        console.log(`RecurringTaskService: Instance already exists for ${currentDueDate}`);
      }

      // Calculate next due date
      currentDueDate = this.calculateNextDueDate(currentDueDate, parentTask.recurrencePattern);

      // Safety check to avoid infinite loops
      if (instances.length > 100) {
        console.warn('Too many recurring instances to create, stopping at 100');
        break;
      }
    }

    console.log(`RecurringTaskService: Will create ${instances.length} instances for "${parentTask.title}"`);
    return instances;
  }

  /**
   * Creates the next instance if it should be created now
   */
  static createNextInstanceIfNeeded(
    parentTask: Task,
    allTasks: Task[]
  ): Omit<Task, 'id' | 'createdAt' | 'updatedAt'> | null {
    if (!this.shouldCreateAutomaticInstances(parentTask, allTasks)) {
      return null;
    }

    const nextDueDate = this.calculateNextDueDate(parentTask.dueDate!, parentTask.recurrencePattern!);
    return this.createRecurringInstance(parentTask, nextDueDate);
  }
}