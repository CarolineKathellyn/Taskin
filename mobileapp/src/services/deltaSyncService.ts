import { DeltaSyncRequest, DeltaSyncResponse, DeltaSyncChange, Task, Project, Category } from '../types';
import { Config } from '../constants';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

export class DeltaSyncService {
  private baseUrl = Config.apiUrl;
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize() {
    this.db = await SQLite.openDatabaseAsync(Config.databaseName);
  }

  private async getAuthToken(): Promise<string> {
    const token = await SecureStore.getItemAsync('authToken');
    if (!token) {
      throw new Error('No auth token found');
    }
    return token;
  }

  /**
   * Sync local changes with server
   */
  async sync(userId: string): Promise<DeltaSyncResponse> {
    if (!this.db) {
      await this.initialize();
    }

    // Get last sync timestamp
    const lastSyncAt = await this.getLastSyncTimestamp();

    // Collect local changes since last sync
    const localChanges = await this.collectLocalChanges(userId, lastSyncAt);

    // Build sync request
    const request: DeltaSyncRequest = {
      changes: localChanges,
      lastSyncAt: lastSyncAt || undefined,
    };

    // Send to server
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/sync/delta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }

    const syncResponse: DeltaSyncResponse = await response.json();

    // Apply server changes to local database
    await this.applyServerChanges(syncResponse.changes);

    // Handle conflicts (last-write-wins)
    await this.resolveConflicts(syncResponse.conflicts);

    // Update last sync timestamp
    await this.updateLastSyncTimestamp(syncResponse.lastSyncAt);

    // Clear applied sync logs
    await this.clearProcessedSyncLogs(lastSyncAt);

    return syncResponse;
  }

  /**
   * Log a change for sync
   */
  async logChange(
    userId: string,
    entityType: 'task' | 'project' | 'category',
    entityId: string,
    action: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    const id = this.generateUUID();
    const timestamp = new Date().toISOString();
    const teamId = data.teamId || null;
    const dataSnapshot = JSON.stringify(data);

    await this.db!.runAsync(
      `INSERT INTO sync_logs (id, user_id, entity_type, entity_id, action, team_id, timestamp, data_snapshot)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, entityType, entityId, action, teamId, timestamp, dataSnapshot]
    );
  }

  /**
   * Collect local changes since last sync
   */
  private async collectLocalChanges(userId: string, since: string | null): Promise<DeltaSyncChange[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const sinceTime = since || new Date(0).toISOString();
    const result = await this.db.getAllAsync(
      `SELECT * FROM sync_logs WHERE user_id = ? AND timestamp > ? ORDER BY timestamp ASC`,
      [userId, sinceTime]
    ) as any[];

    return result.map(row => ({
      entityType: row.entity_type as 'task' | 'project' | 'category',
      entityId: row.entity_id,
      action: row.action as 'create' | 'update' | 'delete',
      data: JSON.parse(row.data_snapshot || '{}'),
      timestamp: row.timestamp,
      version: JSON.parse(row.data_snapshot || '{}').version || 1,
    }));
  }

  /**
   * Apply server changes to local database
   */
  private async applyServerChanges(changes: DeltaSyncChange[]): Promise<void> {
    if (!this.db || !changes || changes.length === 0) {
      return;
    }

    for (const change of changes) {
      try {
        switch (change.action) {
          case 'create':
          case 'update':
            await this.upsertEntity(change.entityType, change.data);
            break;
          case 'delete':
            await this.deleteEntity(change.entityType, change.entityId);
            break;
        }
      } catch (error) {
        console.error(`Error applying change for ${change.entityType}:${change.entityId}`, error);
      }
    }
  }

  /**
   * Upsert entity (insert or update)
   */
  private async upsertEntity(entityType: string, data: any): Promise<void> {
    if (!this.db) return;

    switch (entityType) {
      case 'task':
        await this.upsertTask(data);
        break;
      case 'project':
        await this.upsertProject(data);
        break;
      case 'category':
        await this.upsertCategory(data);
        break;
    }
  }

  private async upsertTask(task: Task): Promise<void> {
    if (!this.db) return;

    const attachmentsJson = task.attachments ? JSON.stringify(task.attachments) : null;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO tasks
       (id, title, description, notes, priority, status, due_date, category_id, project_id,
        progress_percentage, user_id, team_id, last_modified_by, version, created_at, updated_at,
        completed_at, is_recurring, recurrence_pattern, parent_task_id, attachments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id, task.title, task.description, task.notes, task.priority, task.status,
        task.dueDate, task.categoryId, task.projectId, task.progressPercentage, task.userId,
        task.teamId, task.lastModifiedBy, task.version, task.createdAt, task.updatedAt,
        task.completedAt, task.isRecurring ? 1 : 0, task.recurrencePattern, task.parentTaskId,
        attachmentsJson
      ]
    );
  }

  private async upsertProject(project: Project): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO projects
       (id, name, description, color, category_id, icon, user_id, team_id, last_modified_by, version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        project.id, project.name, project.description, project.color, project.categoryId,
        project.icon, project.userId, project.teamId, project.lastModifiedBy, project.version,
        project.createdAt, project.updatedAt
      ]
    );
  }

  private async upsertCategory(category: Category): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO categories
       (id, name, color, user_id, team_id, last_modified_by, version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category.id, category.name, category.color, category.userId, category.teamId,
        category.lastModifiedBy, category.version, category.createdAt, category.updatedAt
      ]
    );
  }

  /**
   * Delete entity from local database
   */
  private async deleteEntity(entityType: string, entityId: string): Promise<void> {
    if (!this.db) return;

    const table = entityType === 'task' ? 'tasks' :
                  entityType === 'project' ? 'projects' : 'categories';

    await this.db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [entityId]);
  }

  /**
   * Resolve conflicts using last-write-wins strategy
   */
  private async resolveConflicts(conflicts: any[]): Promise<void> {
    if (!conflicts || conflicts.length === 0) {
      return;
    }

    for (const conflict of conflicts) {
      // Last-write-wins: Use server version (it won the conflict)
      console.log(`Conflict detected for ${conflict.entityType}:${conflict.entityId}, using server version`);

      // Server version is already applied in applyServerChanges
      // We just need to update local sync log to prevent re-sending
      await this.markConflictResolved(conflict);
    }
  }

  private async markConflictResolved(conflict: any): Promise<void> {
    if (!this.db) return;

    // Delete local sync log for this entity to prevent re-upload
    await this.db.runAsync(
      `DELETE FROM sync_logs WHERE entity_type = ? AND entity_id = ?`,
      [conflict.entityType, conflict.entityId]
    );
  }

  /**
   * Get last sync timestamp from metadata
   */
  private async getLastSyncTimestamp(): Promise<string | null> {
    if (!this.db) return null;

    try {
      // Create metadata table if it doesn't exist
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);

      const result = await this.db.getFirstAsync(
        `SELECT value FROM sync_metadata WHERE key = 'last_sync_at'`
      ) as any;

      return result?.value || null;
    } catch (error) {
      console.error('Error getting last sync timestamp:', error);
      return null;
    }
  }

  /**
   * Update last sync timestamp
   */
  private async updateLastSyncTimestamp(timestamp: string): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ('last_sync_at', ?)`,
      [timestamp]
    );
  }

  /**
   * Clear processed sync logs older than last sync
   */
  private async clearProcessedSyncLogs(since: string | null): Promise<void> {
    if (!this.db || !since) return;

    // Keep recent logs for debugging, delete older ones
    const cutoffDate = new Date(since);
    cutoffDate.setHours(cutoffDate.getHours() - 1); // Keep last hour

    await this.db.runAsync(
      `DELETE FROM sync_logs WHERE timestamp < ?`,
      [cutoffDate.toISOString()]
    );
  }

  /**
   * Get pending changes count
   */
  async getPendingChangesCount(userId: string): Promise<number> {
    if (!this.db) {
      await this.initialize();
    }

    const lastSyncAt = await this.getLastSyncTimestamp() || new Date(0).toISOString();

    const result = await this.db!.getFirstAsync(
      `SELECT COUNT(*) as count FROM sync_logs WHERE user_id = ? AND timestamp > ?`,
      [userId, lastSyncAt]
    ) as any;

    return result?.count || 0;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

export const deltaSyncService = new DeltaSyncService();
