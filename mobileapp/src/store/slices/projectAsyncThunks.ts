import { createAsyncThunk } from '@reduxjs/toolkit';
import { Project } from '../../types';
import { DatabaseService } from '../../services/database/DatabaseService';

let databaseService: DatabaseService | null = null;

const getDatabaseService = async (): Promise<DatabaseService> => {
  if (!databaseService) {
    databaseService = new DatabaseService();
    await databaseService.initializeDatabase();
  }
  return databaseService;
};

export const loadProjects = createAsyncThunk(
  'tasks/loadProjects',
  async (userId: string, { rejectWithValue }) => {
    try {
      const service = await getDatabaseService();
      return await service.getProjects(userId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load projects');
    }
  }
);

export const createProject = createAsyncThunk(
  'tasks/createProject',
  async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const service = await getDatabaseService();
      return await service.createProject(projectData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create project');
    }
  }
);

export const updateProject = createAsyncThunk(
  'tasks/updateProject',
  async ({ id, updates }: { id: string; updates: Partial<Project> }, { rejectWithValue }) => {
    try {
      const service = await getDatabaseService();
      return await service.updateProject(id, updates);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update project');
    }
  }
);

export const deleteProject = createAsyncThunk(
  'tasks/deleteProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const service = await getDatabaseService();
      await service.deleteProject(projectId);
      return projectId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete project');
    }
  }
);