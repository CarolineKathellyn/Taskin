import * as SQLite from 'expo-sqlite';
import { IDatabaseService, Task, Category, Project, DatabaseTask, DatabaseCategory, DatabaseProject, TaskinError } from '../../types';
import { Config } from '../../constants';
import { StringUtils, DateUtils } from '../../utils';

export class DatabaseService implements IDatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initializeDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(Config.databaseName);

      await this.createTables();
    } catch (error) {
      throw new TaskinError('Erro ao inicializar banco de dados', 'DATABASE_INIT_ERROR');
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
  }

  async getTasks(userId: string): Promise<Task[]> {
    if (!this.db) {
      throw new TaskinError('Database not initialized', 'DATABASE_NOT_INITIALIZED');
    }

    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      return result.map(this.mapDatabaseTaskToTask);
    } catch (error) {
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
      await this.db.runAsync(
        `INSERT INTO tasks (id, title, description, notes, priority, status, due_date, category_id, project_id, progress_percentage, user_id, created_at, updated_at, completed_at, is_recurring, recurrence_pattern, parent_task_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          newTask.progressPercentage,
          newTask.userId,
          newTask.createdAt,
          newTask.updatedAt,
          newTask.completedAt || null,
          newTask.isRecurring ? 1 : 0,
          newTask.recurrencePattern || null,
          newTask.parentTaskId || null,
        ]
      );

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
      updatedAt: DateUtils.getCurrentISOString(),
    };

    if (updates.status === 'concluida' && !updatedTask.completedAt) {
      updatedTask.completedAt = DateUtils.getCurrentISOString();
    } else if (updates.status !== 'concluida') {
      updatedTask.completedAt = undefined;
    }

    try {
      console.log('UpdateTask: Executing database update for task ID:', id);
      await this.db.runAsync(
        `UPDATE tasks SET title = ?, description = ?, notes = ?, priority = ?, status = ?, due_date = ?,
         category_id = ?, project_id = ?, progress_percentage = ?, updated_at = ?, completed_at = ?,
         is_recurring = ?, recurrence_pattern = ?, parent_task_id = ? WHERE id = ?`,
        [
          updatedTask.title,
          updatedTask.description || null,
          updatedTask.notes || null,
          updatedTask.priority,
          updatedTask.status,
          updatedTask.dueDate || null,
          updatedTask.categoryId || null,
          updatedTask.projectId || null,
          updatedTask.progressPercentage,
          updatedTask.updatedAt,
          updatedTask.completedAt || null,
          updatedTask.isRecurring ? 1 : 0,
          updatedTask.recurrencePattern || null,
          updatedTask.parentTaskId || null,
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
      const result = await this.db.getAllAsync(
        'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
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

      await this.db.runAsync(
        'INSERT INTO projects (id, name, description, color, category_id, icon, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, project.name, project.description || null, project.color, project.categoryId || null, project.icon, project.userId, now, now]
      );

      return {
        ...project,
        id,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
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

      await this.db.runAsync(
        'UPDATE projects SET name = ?, description = ?, color = ?, category_id = ?, icon = ?, updated_at = ? WHERE id = ?',
        [updatedProject.name, updatedProject.description || null, updatedProject.color, updatedProject.categoryId || null, updatedProject.icon, now, id]
      );

      return updatedProject;
    } catch (error) {
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
      progressPercentage: dbTask.progress_percentage || 0,
      userId: dbTask.user_id,
      createdAt: dbTask.created_at,
      updatedAt: dbTask.updated_at,
      completedAt: dbTask.completed_at,
      isRecurring: !!dbTask.is_recurring,
      recurrencePattern: dbTask.recurrence_pattern as Task['recurrencePattern'],
      parentTaskId: dbTask.parent_task_id,
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
      icon: dbProject.icon || 'briefcase',
      userId: dbProject.user_id,
      createdAt: dbProject.created_at,
      updatedAt: dbProject.updated_at,
    };
  }
}