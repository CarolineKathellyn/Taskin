import { createAsyncThunk } from '@reduxjs/toolkit';
import { Task } from '../../types';
import { DatabaseService } from '../../services/database/DatabaseService';
import { AutoRecurringTaskService } from '../../services/AutoRecurringTaskService';
import { deltaSyncService } from '../../services/deltaSyncService';

const getDatabaseService = async (): Promise<DatabaseService> => {
  const databaseService = DatabaseService.getInstance();
  await databaseService.initializeDatabase();
  return databaseService;
};

export const loadTasks = createAsyncThunk(
  'tasks/loadTasks',
  async (userId: string, { rejectWithValue }) => {
    try {
      const service = await getDatabaseService();
      return await service.getTasks(userId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load tasks');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const service = await getDatabaseService();
      const newTask = await service.createTask(taskData);

      // Log change for delta sync
      try {
        await deltaSyncService.logChange(
          newTask.userId,
          'task',
          newTask.id,
          'create',
          newTask
        );
        console.log('[TaskAsyncThunks] Task creation logged for sync');
      } catch (syncError) {
        console.error('[TaskAsyncThunks] Failed to log task creation for sync:', syncError);
        // Don't fail the whole operation if sync logging fails
      }

      return newTask;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, updates }: { id: string; updates: Partial<Task> }, { rejectWithValue }) => {
    try {
      const service = await getDatabaseService();
      const updatedTask = await service.updateTask(id, updates);

      // Log change for delta sync
      try {
        await deltaSyncService.logChange(
          updatedTask.userId,
          'task',
          updatedTask.id,
          'update',
          updatedTask
        );
        console.log('[TaskAsyncThunks] Task update logged for sync');
      } catch (syncError) {
        console.error('[TaskAsyncThunks] Failed to log task update for sync:', syncError);
        // Don't fail the whole operation if sync logging fails
      }

      return updatedTask;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      console.log(`AsyncThunk deleteTask: Starting deletion for task id: ${id}`);

      // Get the task data before deleting to log for sync
      const state = getState() as any;
      const task = state.tasks.tasks.find((t: Task) => t.id === id);

      // Get current version from database (it may be newer than Redux state)
      const service = await getDatabaseService();
      let currentVersion = 1;
      try {
        const dbTask = await service.getTask(id);
        if (dbTask) {
          currentVersion = dbTask.version || 1;
          console.log(`[TaskAsyncThunks] Task version in DB: ${currentVersion}`);
        }
      } catch (err) {
        console.warn('[TaskAsyncThunks] Could not get task version from DB:', err);
      }
      
      await service.deleteTask(id);
      console.log(`AsyncThunk deleteTask: Successfully deleted task id: ${id}`);

      // Log deletion for delta sync with current version
      if (task) {
        try {
          await deltaSyncService.logChange(
            task.userId,
            'task',
            id,
            'delete',
            { 
              id, 
              userId: task.userId, 
              teamId: task.teamId,
              version: currentVersion // Include current version
            }
          );
          console.log('[TaskAsyncThunks] Task deletion logged for sync with version:', currentVersion);
        } catch (syncError) {
          console.error('[TaskAsyncThunks] Failed to log task deletion for sync:', syncError);
          // Don't fail the whole operation if sync logging fails
        }
      }

      return id;
    } catch (error: any) {
      console.error('AsyncThunk deleteTask: Error deleting task:', error);
      return rejectWithValue(error.message || 'Failed to delete task');
    }
  }
);

export const processRecurringTasks = createAsyncThunk(
  'tasks/processRecurringTasks',
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      console.log('processRecurringTasks: Starting automatic recurring task processing');

      // Get current tasks from state
      const state = getState() as any;
      const currentTasks: Task[] = state.tasks.tasks || [];

      // Create callback to create new tasks
      const service = await getDatabaseService();
      const createTaskCallback = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
        return await service.createTask(taskData);
      };

      // Process recurring tasks
      const createdTasks = await AutoRecurringTaskService.processRecurringTasks(
        currentTasks,
        createTaskCallback
      );

      console.log(`processRecurringTasks: Created ${createdTasks.length} recurring task instances`);
      return createdTasks;
    } catch (error: any) {
      console.error('processRecurringTasks: Error processing recurring tasks:', error);
      return rejectWithValue(error.message || 'Failed to process recurring tasks');
    }
  }
);

// Category CRUD operations removed - using hardcoded categories instead