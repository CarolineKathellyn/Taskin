import { createAsyncThunk } from '@reduxjs/toolkit';
import { Task } from '../../types';
import { DatabaseService } from '../../services/database/DatabaseService';
import { AutoRecurringTaskService } from '../../services/AutoRecurringTaskService';

let databaseService: DatabaseService | null = null;

const getDatabaseService = async (): Promise<DatabaseService> => {
  if (!databaseService) {
    databaseService = new DatabaseService();
    await databaseService.initializeDatabase();
  }
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
      return await service.createTask(taskData);
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
      return await service.updateTask(id, updates);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id: string, { rejectWithValue }) => {
    try {
      console.log(`AsyncThunk deleteTask: Starting deletion for task id: ${id}`);
      const service = await getDatabaseService();
      await service.deleteTask(id);
      console.log(`AsyncThunk deleteTask: Successfully deleted task id: ${id}`);
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