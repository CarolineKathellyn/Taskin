import * as SQLite from 'expo-sqlite';
import { IDatabaseService, Task, Category, Project, DatabaseTask, DatabaseCategory, DatabaseProject, TaskinError } from '../../types';
import { Config } from '../../constants';
import { StringUtils, DateUtils } from '../../utils';

export class DatabaseService implements IDatabaseService {
  private static instance: DatabaseService | null = null;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitializing: boolean = false;

  // Singleton pattern - use getInstance() instead of new DatabaseService()
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initializeDatabase(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.db) {
      return; // Already initialized
    }

    if (this.isInitializing) {
      // Wait for current initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.isInitializing = true;
    try {
      this.db = await SQLite.openDatabaseAsync(Config.databaseName);
      await this.createTables();
    } catch (error) {
      throw new TaskinError('Erro ao inicializar banco de dados', 'DATABASE_INIT_ERROR');
    } finally {
      this.isInitializing = false;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `;

    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `;

    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `;

    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        due_date TEXT,
        category_id TEXT,
        project_id TEXT,
        progress_percentage INTEGER DEFAULT 0,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL
      );
    `;

    await this.db.execAsync(createUsersTable);
    await this.db.execAsync(createCategoriesTable);
    await this.db.execAsync(createProjectsTable);
    await this.db.execAsync(createTasksTable);

    // Migration: Add project_id column to tasks table if it doesn't exist
    try {
      await this.db.execAsync('ALTER TABLE tasks ADD COLUMN project_id TEXT');
      console.log('Added project_id column to tasks table');
    } catch (error) {
      // Column already exists or other error - that's OK
      console.log('project_id column already exists or migration not needed');
    }

    // Migration: Add progress_percentage column to tasks table if it doesn't exist
    try {
      await this.db.execAsync('ALTER TABLE tasks ADD COLUMN progress_percentage INTEGER DEFAULT 0');
      console.log('Added progress_percentage column to tasks table');
    } catch (error) {
      // Column already exists or other error - that's OK
      console.log('progress_percentage column already exists or migration not needed');
    }

    // Migration: Add notes column to tasks table if it doesn't exist
    try {
      await this.db.execAsync('ALTER TABLE tasks ADD COLUMN notes TEXT');
      console.log('Added notes column to tasks table');
    } catch (error) {
      // Column already exists or other error - that's OK
      console.log('notes column already exists or migration not needed');
    }

    // Migration: Add recurring task columns
    try {
      await this.db.execAsync('ALTER TABLE tasks ADD COLUMN is_recurring INTEGER DEFAULT 0');
      console.log('Added is_recurring column to tasks table');
    } catch (error) {
      console.log('is_recurring column already exists or migration not needed');
    }

    try {
      await this.db.execAsync('ALTER TABLE tasks ADD COLUMN recurrence_pattern TEXT');
      console.log('Added recurrence_pattern column to tasks table');
    } catch (error) {
      console.log('recurrence_pattern column already exists or migration not needed');
    }

    try {
      await this.db.execAsync('ALTER TABLE tasks ADD COLUMN parent_task_id TEXT');
      console.log('Added parent_task_id column to tasks table');
    } catch (error) {
      console.log('parent_task_id column already exists or migration not needed');
    }

    // Migration: Add category_id and icon columns to projects table
    try {
      await this.db.execAsync('ALTER TABLE projects ADD COLUMN category_id TEXT');
      console.log('Added category_id column to projects table');
    } catch (error) {
      console.log('category_id column already exists or migration not needed');
    }

    try {
      await this.db.execAsync('ALTER TABLE projects ADD COLUMN icon TEXT DEFAULT "briefcase"');
      console.log('Added icon column to projects table');
    } catch (error) {
      console.log('icon column already exists or migration not needed');
    }

    // Migration: Add attachments column to tasks table
    try {
      await this.db.execAsync('ALTER TABLE tasks ADD COLUMN attachments TEXT');
      console.log('Added attachments column to tasks table');
    } catch (error) {
      console.log('attachments column already exists or migration not needed');
    }

    // Migration: Add team support columns to tasks
    try {
      await this.db.execAsync('ALTER TABLE tasks ADD COLUMN team_id TEXT');
      console.log('Added team_id column to tasks table');
    } catch (error) {
      console.log('team_id column already exists or migration not needed');
    }

    try {
      await this.db.execAsync('ALTER TABLE tasks ADD COLUMN last_modified_by TEXT');
      console.log('Added last_modified_by column to tasks table');
    } catch (error) {
      console.log('last_modified_by column already exists or migration not needed');
    }

    try {
      await this.db.execAsync('ALTER TABLE tasks ADD COLUMN version INTEGER DEFAULT 1');
      console.log('Added version column to tasks table');
    } catch (error) {
      console.log('version column already exists or migration not needed');
    }

    // Migration: Add team support columns to categories
    try {
      await this.db.execAsync('ALTER TABLE categories ADD COLUMN team_id TEXT');
      console.log('Added team_id column to categories table');
    } catch (error) {
      console.log('team_id column already exists or migration not needed');
    }

    try {
      await this.db.execAsync('ALTER TABLE categories ADD COLUMN last_modified_by TEXT');
      console.log('Added last_modified_by column to categories table');
    } catch (error) {
      console.log('last_modified_by column already exists or migration not needed');
    }

    try {
      await this.db.execAsync('ALTER TABLE categories ADD COLUMN version INTEGER DEFAULT 1');
      console.log('Added version column to categories table');
    } catch (error) {
      console.log('version column already exists or migration not needed');
    }

    // Migration: Add team support columns to projects
    try {
      await this.db.execAsync('ALTER TABLE projects ADD COLUMN team_id TEXT');
      console.log('Added team_id column to projects table');
    } catch (error) {
      console.log('team_id column already exists or migration not needed');
    }

    try {
      await this.db.execAsync('ALTER TABLE projects ADD COLUMN last_modified_by TEXT');
      console.log('Added last_modified_by column to projects table');
    } catch (error) {
      console.log('last_modified_by column already exists or migration not needed');
    }

    try {
      await this.db.execAsync('ALTER TABLE projects ADD COLUMN version INTEGER DEFAULT 1');
      console.log('Added version column to projects table');
    } catch (error) {
      console.log('version column already exists or migration not needed');
    }

    // Create teams table
    const createTeamsTable = `
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `;
    await this.db.execAsync(createTeamsTable);

    // Create team_members table
    const createTeamMembersTable = `
      CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        joined_at TEXT NOT NULL,
        FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
      );
    `;
    await this.db.execAsync(createTeamMembersTable);

    // Create sync_logs table
    const createSyncLogsTable = `
      CREATE TABLE IF NOT EXISTS sync_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        team_id TEXT,
        timestamp TEXT NOT NULL,
        data_snapshot TEXT
      );
    `;
    await this.db.execAsync(createSyncLogsTable);

    // Create index for sync_logs
    try {
      await this.db.execAsync('CREATE INDEX IF NOT EXISTS idx_sync_logs_timestamp ON sync_logs(timestamp)');
      console.log('Created index on sync_logs.timestamp');
    } catch (error) {
      console.log('Index on sync_logs.timestamp already exists or migration not needed');
    }
  }

  async getTasks(userId: string): Promise<Task[]> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    try {
      console.log(`[DatabaseService] Getting tasks for user: ${userId}`);

      // Debug: Check what team members exist
      const teamMembersDebug = await this.db.getAllAsync(
        'SELECT * FROM team_members WHERE user_id = ?',
        [userId]
      );
      console.log(`[DatabaseService] User is member of ${teamMembersDebug.length} teams:`, teamMembersDebug);

      // Debug: Check what tasks exist with team_id
      const teamTasksDebug = await this.db.getAllAsync(
        'SELECT id, title, team_id FROM tasks WHERE team_id IS NOT NULL'
      );
      console.log(`[DatabaseService] Total team tasks in DB: ${teamTasksDebug.length}`, teamTasksDebug);

      // Fetch tasks where:
      // 1. User is the creator (user_id = ?)
      // 2. OR task belongs to a team where user is a member
      const result = await this.db.getAllAsync(
        `SELECT DISTINCT t.* FROM tasks t
         LEFT JOIN team_members tm ON t.team_id = tm.team_id
         WHERE t.user_id = ?
            OR (t.team_id IS NOT NULL AND tm.user_id = ?)
         ORDER BY t.created_at DESC`,
        [userId, userId]
      );

      console.log(`[DatabaseService] Query returned ${result.length} tasks`);

      return result.map(this.mapDatabaseTaskToTask);
    } catch (error) {
      console.error('[DatabaseService] Error in getTasks:', error);
      throw new TaskinError('Erro ao buscar tarefas', 'DATABASE_READ_ERROR');
    }
  }

  async getTask(id: string): Promise<Task | null> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM tasks WHERE id = ?',
        [id]
      );

      return result ? this.mapDatabaseTaskToTask(result as DatabaseTask) : null;
    } catch (error) {
      console.error('Database error in getTask:', error, 'for ID:', id);
      throw new TaskinError('Erro ao buscar tarefa', 'DATABASE_READ_ERROR');
    }
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    const id = StringUtils.generateId();
    const now = DateUtils.getCurrentISOString();

    const newTask: Task = {
      ...task,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      console.log(`[DatabaseService] Creating task with team_id: ${newTask.teamId || 'null'}`);

      await this.db.runAsync(
        `INSERT INTO tasks (id, title, description, notes, priority, status, due_date, category_id, project_id, team_id, progress_percentage, user_id, created_at, updated_at, completed_at, is_recurring, recurrence_pattern, parent_task_id, attachments)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newTask.id,
          newTask.title,
          newTask.description || null,
          newTask.notes || null,
          newTask.priority,
          newTask.status,
          newTask.dueDate || null,
          newTask.categoryId || null,
          newTask.projectId || null,
          newTask.teamId || null,
          newTask.progressPercentage,
          newTask.userId,
          newTask.createdAt,
          newTask.updatedAt,
          newTask.completedAt || null,
          newTask.isRecurring ? 1 : 0,
          newTask.recurrencePattern || null,
          newTask.parentTaskId || null,
          newTask.attachments ? JSON.stringify(newTask.attachments) : null,
        ]
      );

      console.log(`[DatabaseService] Task created successfully with ID: ${newTask.id}`);
      return newTask;
    } catch (error) {
      console.error('Database error creating task:', error);
      throw new TaskinError('Erro ao criar tarefa', 'DATABASE_WRITE_ERROR');
    }
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    console.log('UpdateTask: Attempting to get task with ID:', id);
    const existingTask = await this.getTask(id);
    if (!existingTask) {
      console.error('UpdateTask: Task not found with ID:', id);
      throw new TaskinError('Tarefa não encontrada', 'TASK_NOT_FOUND');
    }

    console.log('UpdateTask: Found existing task:', existingTask.title);

    const updatedTask: Task = {
      ...existingTask,
      ...updates,
      version: (existingTask.version || 0) + 1, // Increment version on every update
      updatedAt: DateUtils.getCurrentISOString(),
    };

    if (updates.status === 'concluida' && !updatedTask.completedAt) {
      updatedTask.completedAt = DateUtils.getCurrentISOString();
    } else if (updates.status !== 'concluida') {
      updatedTask.completedAt = undefined;
    }

    try {
      console.log(`UpdateTask: Executing database update for task ID: ${id}, team_id: ${updatedTask.teamId || 'null'}, version: ${updatedTask.version}`);
      await this.db.runAsync(
        `UPDATE tasks SET title = ?, description = ?, notes = ?, priority = ?, status = ?, due_date = ?,
         category_id = ?, project_id = ?, team_id = ?, progress_percentage = ?, updated_at = ?, completed_at = ?,
         is_recurring = ?, recurrence_pattern = ?, parent_task_id = ?, attachments = ?, version = ? WHERE id = ?`,
        [
          updatedTask.title,
          updatedTask.description || null,
          updatedTask.notes || null,
          updatedTask.priority,
          updatedTask.status,
          updatedTask.dueDate || null,
          updatedTask.categoryId || null,
          updatedTask.projectId || null,
          updatedTask.teamId || null,
          updatedTask.progressPercentage,
          updatedTask.updatedAt,
          updatedTask.completedAt || null,
          updatedTask.isRecurring ? 1 : 0,
          updatedTask.recurrencePattern || null,
          updatedTask.parentTaskId || null,
          updatedTask.attachments ? JSON.stringify(updatedTask.attachments) : null,
          updatedTask.version,
          id,
        ]
      );

      console.log('UpdateTask: Database update successful');
      return updatedTask;
    } catch (error) {
      console.error('UpdateTask: Database update error:', error);
      throw new TaskinError('Erro ao atualizar tarefa', 'DATABASE_WRITE_ERROR');
    }
  }

  async deleteTask(id: string): Promise<void> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    try {
      console.log(`DeleteTask: Attempting to delete task with id: ${id}`);
      const result = await this.db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
      console.log(`DeleteTask: Successfully deleted task. Changes: ${result.changes}`);

      if (result.changes === 0) {
        console.warn(`DeleteTask: No task found with id: ${id}`);
      }
    } catch (error) {
      console.error('DeleteTask: Database delete error:', error);
      throw new TaskinError('Erro ao excluir tarefa', 'DATABASE_WRITE_ERROR');
    }
  }

  async getCategories(userId: string): Promise<Category[]> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM categories WHERE user_id = ? ORDER BY name ASC',
        [userId]
      );

      return result.map(this.mapDatabaseCategoryToCategory);
    } catch (error) {
      throw new TaskinError('Erro ao buscar categorias', 'DATABASE_READ_ERROR');
    }
  }

  async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    const id = StringUtils.generateId();
    const now = DateUtils.getCurrentISOString();

    const newCategory: Category = {
      ...category,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.db.runAsync(
        'INSERT INTO categories (id, name, color, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [newCategory.id, newCategory.name, newCategory.color, newCategory.userId, newCategory.createdAt, newCategory.updatedAt]
      );

      return newCategory;
    } catch (error) {
      throw new TaskinError('Erro ao criar categoria', 'DATABASE_WRITE_ERROR');
    }
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    const existingCategory = await this.getCategory(id);
    if (!existingCategory) {
      throw new TaskinError('Categoria não encontrada', 'CATEGORY_NOT_FOUND');
    }

    const updatedCategory: Category = {
      ...existingCategory,
      ...updates,
      updatedAt: DateUtils.getCurrentISOString(),
    };

    try {
      await this.db.runAsync(
        'UPDATE categories SET name = ?, color = ?, updated_at = ? WHERE id = ?',
        [updatedCategory.name, updatedCategory.color, updatedCategory.updatedAt, id]
      );

      return updatedCategory;
    } catch (error) {
      throw new TaskinError('Erro ao atualizar categoria', 'DATABASE_WRITE_ERROR');
    }
  }

  async deleteCategory(id: string): Promise<void> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    try {
      await this.db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
    } catch (error) {
      throw new TaskinError('Erro ao excluir categoria', 'DATABASE_WRITE_ERROR');
    }
  }

  async getProjects(userId: string): Promise<Project[]> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    try {
      // Fetch projects where:
      // 1. User is the creator (user_id = ?)
      // 2. OR project belongs to a team where user is a member
      const result = await this.db.getAllAsync(
        `SELECT DISTINCT p.* FROM projects p
         LEFT JOIN team_members tm ON p.team_id = tm.team_id
         WHERE p.user_id = ?
            OR (p.team_id IS NOT NULL AND tm.user_id = ?)
         ORDER BY p.created_at DESC`,
        [userId, userId]
      );

      return result.map(this.mapDatabaseProjectToProject);
    } catch (error) {
      throw new TaskinError('Erro ao buscar projetos', 'DATABASE_READ_ERROR');
    }
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    try {
      const id = StringUtils.generateId();
      const now = DateUtils.getCurrentISOString();

      console.log(`[DatabaseService] Creating project with team_id: ${project.teamId || 'null'}`);

      await this.db.runAsync(
        'INSERT INTO projects (id, name, description, color, category_id, team_id, icon, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, project.name, project.description || null, project.color, project.categoryId || null, project.teamId || null, project.icon, project.userId, now, now]
      );

      console.log(`[DatabaseService] Project created successfully with ID: ${id}`);

      return {
        ...project,
        id,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('[DatabaseService] Error creating project:', error);
      throw new TaskinError('Erro ao criar projeto', 'DATABASE_WRITE_ERROR');
    }
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    try {
      const existingProject = await this.getProject(id);
      if (!existingProject) {
        throw new TaskinError('Projeto não encontrado', 'PROJECT_NOT_FOUND');
      }

      const now = DateUtils.getCurrentISOString();
      const updatedProject = { ...existingProject, ...updates, updatedAt: now };

      console.log(`[DatabaseService] Updating project ${id} with team_id: ${updatedProject.teamId || 'null'}`);

      await this.db.runAsync(
        'UPDATE projects SET name = ?, description = ?, color = ?, category_id = ?, team_id = ?, icon = ?, updated_at = ? WHERE id = ?',
        [updatedProject.name, updatedProject.description || null, updatedProject.color, updatedProject.categoryId || null, updatedProject.teamId || null, updatedProject.icon, now, id]
      );

      console.log(`[DatabaseService] Project updated successfully`);

      return updatedProject;
    } catch (error) {
      console.error('[DatabaseService] Error updating project:', error);
      throw new TaskinError('Erro ao atualizar projeto', 'DATABASE_UPDATE_ERROR');
    }
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    try {
      await this.db.runAsync('UPDATE tasks SET project_id = NULL WHERE project_id = ?', [id]);
      await this.db.runAsync('DELETE FROM projects WHERE id = ?', [id]);
    } catch (error) {
      throw new TaskinError('Erro ao excluir projeto', 'DATABASE_DELETE_ERROR');
    }
  }

  async exportDatabase(): Promise<string> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    try {
      const tasks = await this.db.getAllAsync('SELECT * FROM tasks');
      const categories = await this.db.getAllAsync('SELECT * FROM categories');

      const exportData = {
        tasks,
        categories,
        exportedAt: DateUtils.getCurrentISOString(),
        version: Config.databaseVersion,
      };

      return JSON.stringify(exportData);
    } catch (error) {
      throw new TaskinError('Erro ao exportar banco de dados', 'DATABASE_EXPORT_ERROR');
    }
  }

  async importDatabase(data: string): Promise<void> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    try {
      const importData = JSON.parse(data);

      await this.db.runAsync('DELETE FROM tasks');
      await this.db.runAsync('DELETE FROM categories');

      if (importData.categories) {
        for (const category of importData.categories) {
          await this.db.runAsync(
            'INSERT INTO categories (id, name, color, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [category.id, category.name, category.color, category.user_id, category.created_at, category.updated_at]
          );
        }
      }

      if (importData.tasks) {
        for (const task of importData.tasks) {
          await this.db.runAsync(
            `INSERT INTO tasks (id, title, description, priority, status, due_date, category_id, user_id, created_at, updated_at, completed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              task.id,
              task.title,
              task.description,
              task.priority,
              task.status,
              task.due_date,
              task.category_id,
              task.user_id,
              task.created_at,
              task.updated_at,
              task.completed_at,
            ]
          );
        }
      }
    } catch (error) {
      throw new TaskinError('Erro ao importar banco de dados', 'DATABASE_IMPORT_ERROR');
    }
  }

  private async getCategory(id: string): Promise<Category | null> {
    if (!this.db) return null;

    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM categories WHERE id = ?',
        [id]
      );

      return result ? this.mapDatabaseCategoryToCategory(result as DatabaseCategory) : null;
    } catch (error) {
      return null;
    }
  }

  private async getProject(id: string): Promise<Project | null> {
    if (!this.db) return null;

    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM projects WHERE id = ?',
        [id]
      );

      return result ? this.mapDatabaseProjectToProject(result as DatabaseProject) : null;
    } catch (error) {
      return null;
    }
  }

  private mapDatabaseTaskToTask(dbTask: any): Task {
    let attachments;
    try {
      attachments = dbTask.attachments ? JSON.parse(dbTask.attachments) : undefined;
    } catch (error) {
      console.error('Error parsing attachments JSON:', error);
      attachments = undefined;
    }

    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description,
      notes: dbTask.notes,
      priority: dbTask.priority as Task['priority'],
      status: dbTask.status as Task['status'],
      dueDate: dbTask.due_date,
      categoryId: dbTask.category_id,
      projectId: dbTask.project_id,
      teamId: dbTask.team_id,
      progressPercentage: dbTask.progress_percentage || 0,
      userId: dbTask.user_id,
      version: dbTask.version || 0,
      lastModifiedBy: dbTask.last_modified_by,
      createdAt: dbTask.created_at,
      updatedAt: dbTask.updated_at,
      completedAt: dbTask.completed_at,
      isRecurring: !!dbTask.is_recurring,
      recurrencePattern: dbTask.recurrence_pattern as Task['recurrencePattern'],
      parentTaskId: dbTask.parent_task_id,
      attachments: attachments,
    };
  }

  private mapDatabaseCategoryToCategory(dbCategory: any): Category {
    return {
      id: dbCategory.id,
      name: dbCategory.name,
      color: dbCategory.color,
      userId: dbCategory.user_id,
      createdAt: dbCategory.created_at,
      updatedAt: dbCategory.updated_at,
    };
  }

  private mapDatabaseProjectToProject(dbProject: any): Project {
    return {
      id: dbProject.id,
      name: dbProject.name,
      description: dbProject.description,
      color: dbProject.color,
      categoryId: dbProject.category_id,
      teamId: dbProject.team_id,
      icon: dbProject.icon || 'briefcase',
      userId: dbProject.user_id,
      version: dbProject.version || 0,
      lastModifiedBy: dbProject.last_modified_by,
      createdAt: dbProject.created_at,
      updatedAt: dbProject.updated_at,
    };
  }

  // Team member management methods
  async saveTeamMembers(teamId: string, members: any[]): Promise<void> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    try {
      console.log(`[DatabaseService] Saving ${members.length} members for team ${teamId}`);

      // First, delete existing members for this team
      await this.db.runAsync(
        'DELETE FROM team_members WHERE team_id = ?',
        [teamId]
      );

      // Then insert all current members
      for (const member of members) {
        console.log(`[DatabaseService] Inserting member: userId=${member.userId}, role=${member.role}`);
        await this.db.runAsync(
          `INSERT INTO team_members (id, team_id, user_id, role, joined_at)
           VALUES (?, ?, ?, ?, ?)`,
          [
            member.id || `${teamId}-${member.userId}`,
            teamId,
            member.userId,
            member.role,
            member.joinedAt || new Date().toISOString()
          ]
        );
      }

      console.log(`[DatabaseService] Successfully saved ${members.length} team members`);
    } catch (error) {
      console.error('Error saving team members:', error);
      throw new TaskinError('Erro ao salvar membros da equipe', 'DATABASE_WRITE_ERROR');
    }
  }

  async getTeamMembers(teamId: string): Promise<any[]> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM team_members WHERE team_id = ?',
        [teamId]
      );

      return result.map((row: any) => ({
        id: row.id,
        teamId: row.team_id,
        userId: row.user_id,
        role: row.role,
        joinedAt: row.joined_at
      }));
    } catch (error) {
      console.error('Error getting team members:', error);
      return [];
    }
  }

  async deleteTeamMembers(teamId: string): Promise<void> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    try {
      await this.db.runAsync(
        'DELETE FROM team_members WHERE team_id = ?',
        [teamId]
      );
    } catch (error) {
      console.error('Error deleting team members:', error);
      throw new TaskinError('Erro ao excluir membros da equipe', 'DATABASE_WRITE_ERROR');
    }
  }
}