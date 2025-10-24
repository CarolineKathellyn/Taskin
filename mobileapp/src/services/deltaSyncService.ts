import { DeltaSyncRequest, DeltaSyncResponse, DeltaSyncChange, Task, Project, Category } from '../types';
import { Config } from '../constants';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

export class DeltaSyncService {
  private baseUrl = Config.apiBaseUrl;
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize() {
    this.db = await SQLite.openDatabaseAsync(Config.databaseName);
  }

  private async getAuthToken(): Promise<string> {
    const token = await SecureStore.getItemAsync(Config.storageKeys.authToken);
    if (!token) {
      throw new Error('No auth token found');
    }
    return token;
  }

  /**
   * Sync local changes with server
   * 
   * Key improvements:
   * 1. Deduplicates sync_logs - only sends the latest action for each entity
   * 2. Clears processed logs AFTER server confirms receipt (using server's lastSyncAt)
   * 3. This ensures delete actions are properly sent before being cleared
   */
  async sync(userId: string): Promise<DeltaSyncResponse> {
    if (!this.db) {
      await this.initialize();
    }

    console.log('[DeltaSync] Starting sync for user:', userId);

    // Get last sync timestamp
    const lastSyncAt = await this.getLastSyncTimestamp();
    console.log('[DeltaSync] Last sync at:', lastSyncAt);

    // Collect local changes since last sync
    const localChanges = await this.collectLocalChanges(userId, lastSyncAt);
    console.log('[DeltaSync] Found local changes:', localChanges.length);
    console.log('[DeltaSync] Changes:', JSON.stringify(localChanges, null, 2));

    // Build sync request
    const request: DeltaSyncRequest = {
      changes: localChanges,
      lastSyncAt: lastSyncAt || undefined,
    };

    // Send to server
    const token = await this.getAuthToken();
    console.log('[DeltaSync] Got auth token:', token ? 'YES' : 'NO');
    console.log('[DeltaSync] Sending to:', `${this.baseUrl}/sync/delta`);

    const response = await fetch(`${this.baseUrl}/sync/delta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    console.log('[DeltaSync] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DeltaSync] Server error:', errorText);
      throw new Error(`Sync failed: ${response.status} - ${errorText}`);
    }

    const syncResponse: DeltaSyncResponse = await response.json();
    console.log('[DeltaSync] Sync response:', JSON.stringify(syncResponse, null, 2));

    // Apply server changes to local database
    await this.applyServerChanges(syncResponse.changes);

    // Handle conflicts (last-write-wins)
    await this.resolveConflicts(syncResponse.conflicts);

    // Update last sync timestamp
    await this.updateLastSyncTimestamp(syncResponse.lastSyncAt);

    // Clear processed sync logs (only those that were sent to server)
    await this.clearProcessedSyncLogs(syncResponse.lastSyncAt);

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
    console.log('[DeltaSync] logChange called:', { userId, entityType, entityId, action });

    if (!this.db) {
      console.log('[DeltaSync] Database not initialized, initializing...');
      await this.initialize();
    }

    const id = this.generateUUID();
    const timestamp = new Date().toISOString();
    const teamId = data.teamId || null;
    const dataSnapshot = JSON.stringify(data);

    console.log('[DeltaSync] Inserting into sync_logs:', { id, userId, entityType, entityId, action, teamId });

    await this.db!.runAsync(
      `INSERT INTO sync_logs (id, user_id, entity_type, entity_id, action, team_id, timestamp, data_snapshot)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, entityType, entityId, action, teamId, timestamp, dataSnapshot]
    );

    console.log('[DeltaSync] Successfully logged change to sync_logs');
  }

  /**
   * Collect local changes since last sync
   */
  private async collectLocalChanges(userId: string, since: string | null): Promise<DeltaSyncChange[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Normalize the 'since' timestamp to ensure proper comparison
    // Server may send timestamps without 'Z', but client stores with 'Z'
    let normalizedSince = since || new Date(0).toISOString();
    if (since && !since.endsWith('Z') && !since.includes('+')) {
      // Parse as Date and convert to ISO string (adds 'Z')
      const sinceDate = new Date(since + 'Z'); // Treat server time as UTC
      normalizedSince = sinceDate.toISOString();
    }
    
    console.log(`[DeltaSync] Collecting changes since: ${normalizedSince} (original: ${since})`);
    
    // Get user's team IDs
    const userTeams = await this.db.getAllAsync(
      `SELECT team_id FROM team_members WHERE user_id = ?`,
      [userId]
    ) as any[];
    
    const teamIds = userTeams.map(t => t.team_id);
    
    // Collect sync logs for:
    // 1. Changes made by this user (user_id = ?)
    // 2. Changes to team entities where user is a member (team_id IN (...) OR team_id IS NULL)
    //    Note: NULL team_id means the task/entity belongs to teams but teamId wasn't set in the log
    let query = `SELECT * FROM sync_logs WHERE timestamp > ? AND (user_id = ?`;
    const params: any[] = [normalizedSince, userId];
    
    if (teamIds.length > 0) {
      const placeholders = teamIds.map(() => '?').join(',');
      query += ` OR team_id IN (${placeholders})`;
      params.push(...teamIds);
      
      // Also include logs where team_id is NULL but the entity exists in a team
      // This handles cases where delete logs don't have team_id set
      query += ` OR (team_id IS NULL AND entity_id IN (
        SELECT id FROM tasks WHERE team_id IN (${placeholders})
        UNION SELECT id FROM projects WHERE team_id IN (${placeholders})
        UNION SELECT id FROM categories WHERE team_id IN (${placeholders})
      ))`;
      params.push(...teamIds, ...teamIds, ...teamIds);
    }
    
    query += `) ORDER BY timestamp ASC`;
    
    console.log(`[DeltaSync] Collecting logs for user and ${teamIds.length} teams`);
    
    const result = await this.db.getAllAsync(query, params) as any[];

    console.log(`[DeltaSync] Found ${result.length} raw sync log entries`);

    // Deduplicate: Keep only the latest action for each entity
    const entityMap = new Map<string, any>();
    
    for (const row of result) {
      const key = `${row.entity_type}:${row.entity_id}`;
      const existing = entityMap.get(key);
      
      // Keep the latest timestamp for each entity
      if (!existing || row.timestamp > existing.timestamp) {
        if (existing) {
          console.log(`[DeltaSync] Replacing ${key} action from ${existing.action} (${existing.timestamp}) to ${row.action} (${row.timestamp})`);
        }
        entityMap.set(key, row);
      }
    }

    console.log(`[DeltaSync] After deduplication: ${entityMap.size} unique entities`);

    // Convert map back to array of changes
    return Array.from(entityMap.values()).map(row => {
      const dataSnapshot = row.data_snapshot || '{}';
      const parsedData = JSON.parse(dataSnapshot);

      return {
        entityType: row.entity_type as 'task' | 'project' | 'category',
        entityId: row.entity_id,
        action: row.action as 'create' | 'update' | 'delete',
        data: dataSnapshot, // Send as JSON string, not parsed object!
        timestamp: row.timestamp,
        version: parsedData.version || 1,
      };
    });
  }

  /**
   * Apply server changes to local database
   */
  private async applyServerChanges(changes: DeltaSyncChange[]): Promise<void> {
    if (!this.db || !changes || changes.length === 0) {
      console.log('[DeltaSync] No server changes to apply');
      return;
    }

    console.log(`[DeltaSync] Applying ${changes.length} server changes`);

    // Check for pending local deletes
    const pendingDeletes = new Set<string>();
    const deleteLogsResult = await this.db.getAllAsync(
      `SELECT entity_type, entity_id FROM sync_logs WHERE action = 'delete'`
    ) as any[];
    
    deleteLogsResult.forEach(log => {
      pendingDeletes.add(`${log.entity_type}:${log.entity_id}`);
    });
    
    console.log(`[DeltaSync] Found ${pendingDeletes.size} pending local deletes`);

    for (const change of changes) {
      try {
        const entityKey = `${change.entityType}:${change.entityId}`;
        
        // Skip applying server updates/creates if we have a pending delete for this entity
        if (pendingDeletes.has(entityKey) && change.action !== 'delete') {
          console.log(`[DeltaSync] ⚠️  Skipping server ${change.action} for ${entityKey} - local delete pending`);
          continue;
        }
        
        console.log(`[DeltaSync] Applying ${change.action} for ${change.entityType} ${change.entityId}`);
        
        if (change.action === 'delete') {
          console.log(`[DeltaSync] ⚠️  RECEIVED DELETE from server for ${change.entityType}:${change.entityId}`);
        }

        switch (change.action) {
          case 'create':
          case 'update':
            // Parse data from JSON string to object
            const parsedData = typeof change.data === 'string' ? JSON.parse(change.data) : change.data;
            await this.upsertEntity(change.entityType, parsedData);
            break;
          case 'delete':
            console.log(`[DeltaSync] Deleting ${change.entityType} ${change.entityId} from local database`);
            await this.deleteEntity(change.entityType, change.entityId);
            console.log(`[DeltaSync] Successfully deleted ${change.entityType} ${change.entityId}`);
            break;
        }
      } catch (error) {
        console.error(`[DeltaSync] Error applying change for ${change.entityType}:${change.entityId}`, error);
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

    // Check if local version exists and is newer
    const existingTask = await this.db.getFirstAsync(
      'SELECT version FROM tasks WHERE id = ?',
      [task.id]
    ) as any;

    if (existingTask && existingTask.version >= (task.version || 0)) {
      console.log(`[DeltaSync] Skipping task ${task.id} - local version ${existingTask.version} >= server version ${task.version}`);
      return; // Don't overwrite newer local data
    }

    console.log(`[DeltaSync] Updating task ${task.id} from version ${existingTask?.version || 0} to ${task.version}`);

    const attachmentsJson = task.attachments ? JSON.stringify(task.attachments) : null;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO tasks
       (id, title, description, notes, priority, status, due_date, category_id, project_id,
        progress_percentage, user_id, team_id, last_modified_by, version, created_at, updated_at,
        completed_at, is_recurring, recurrence_pattern, parent_task_id, attachments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id, task.title || '', task.description || null, task.notes || null, task.priority, task.status,
        task.dueDate || null, task.categoryId || null, task.projectId || null, task.progressPercentage || 0, task.userId,
        task.teamId || null, task.lastModifiedBy || null, task.version || 1, task.createdAt, task.updatedAt,
        task.completedAt || null, task.isRecurring ? 1 : 0, task.recurrencePattern || null, task.parentTaskId || null,
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
        project.id, project.name, project.description || null, project.color || null, project.categoryId || null,
        project.icon || null, project.userId, project.teamId || null, project.lastModifiedBy || null, project.version || 1,
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
        category.id, category.name, category.color || null, category.userId, category.teamId || null,
        category.lastModifiedBy || null, category.version || 1, category.createdAt, category.updatedAt
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

    console.log(`[DeltaSync] Deleting from ${table} where id = ${entityId}`);
    
    const result = await this.db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [entityId]);
    
    console.log(`[DeltaSync] Delete result:`, result);
    console.log(`[DeltaSync] Rows affected: ${result.changes}`);
    
    // Verify deletion
    const check = await this.db.getFirstAsync(`SELECT id FROM ${table} WHERE id = ?`, [entityId]);
    console.log(`[DeltaSync] Verification - Task still exists:`, check ? 'YES' : 'NO');
  }

  /**
   * Resolve conflicts using last-write-wins strategy
   * Special handling for deletes: delete wins over update
   */
  private async resolveConflicts(conflicts: any[]): Promise<void> {
    if (!conflicts || conflicts.length === 0) {
      return;
    }

    for (const conflict of conflicts) {
      console.log(`[DeltaSync] Conflict detected for ${conflict.entityType}:${conflict.entityId}`);
      console.log(`[DeltaSync] Local version: ${conflict.localVersion}, Server version: ${conflict.serverVersion}`);
      console.log(`[DeltaSync] Local data:`, conflict.localData);
      
      // Check if local action was a delete
      const localData = JSON.parse(conflict.localData || '{}');
      const isLocalDelete = !localData.title && !localData.name; // Delete logs only have id, userId, teamId
      
      if (isLocalDelete) {
        console.log(`[DeltaSync] ⚠️  Local action was DELETE - respecting user's delete intention`);
        // Delete the entity locally (server will send it back, but we delete it)
        await this.deleteEntity(conflict.entityType, conflict.entityId);
        
        // Update the delete log with the server's version to retry with correct version
        const serverData = JSON.parse(conflict.serverData || '{}');
        const serverVersion = serverData.version || conflict.serverVersion;
        
        console.log(`[DeltaSync] Updating delete log with server version: ${serverVersion}`);
        await this.db!.runAsync(
          `UPDATE sync_logs 
           SET data_snapshot = ? 
           WHERE entity_type = ? AND entity_id = ? AND action = 'delete'`,
          [
            JSON.stringify({ 
              id: conflict.entityId, 
              userId: localData.userId, 
              teamId: localData.teamId,
              version: serverVersion
            }),
            conflict.entityType,
            conflict.entityId
          ]
        );
        
        console.log(`[DeltaSync] Delete will be retried on next sync with version ${serverVersion}`);
      } else {
        console.log(`[DeltaSync] Using server version (last-write-wins)`);
        // Server version is already applied in applyServerChanges
        // Delete local sync log for this entity to prevent re-sending
        await this.markConflictResolved(conflict);
      }
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
  /**
   * Clear sync logs that have been successfully processed by the server
   * Only clears logs older than the confirmed server sync timestamp
   */
  private async clearProcessedSyncLogs(since: string | null): Promise<void> {
    if (!this.db || !since) return;

    // Normalize the timestamp to ensure proper comparison
    // Server may send timestamps without 'Z', so we need to handle both formats
    let normalizedSince = since;
    if (!since.endsWith('Z') && !since.includes('+')) {
      // If no timezone info, assume it's UTC and add 'Z'
      normalizedSince = since + 'Z';
    }

    console.log(`[DeltaSync] Clearing sync logs with timestamp <= ${normalizedSince}`);

    // Clear logs that were successfully sent to server (timestamp <= server's lastSyncAt)
    await this.db.runAsync(
      `DELETE FROM sync_logs WHERE timestamp <= ?`,
      [normalizedSince]
    );
    
    // Log how many remain
    const remaining = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM sync_logs`
    ) as any;
    
    console.log(`[DeltaSync] Cleared processed sync logs. Remaining: ${remaining?.count || 0}`);
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
