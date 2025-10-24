package com.server.taskin.service;

import com.server.taskin.dto.DeltaSyncRequest;
import com.server.taskin.dto.DeltaSyncResponse;
import com.server.taskin.model.SyncLog;
import com.server.taskin.model.SharedTask;
import com.server.taskin.repository.SyncLogRepository;
import com.server.taskin.repository.SharedTaskRepository;
import com.server.taskin.util.JsonUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class DeltaSyncService {

    @Autowired
    private SyncLogRepository syncLogRepository;

    @Autowired
    private SharedTaskRepository sharedTaskRepository;

    @Autowired
    private TeamService teamService;

    /**
     * Process delta sync request from client
     * - Apply client changes to server
     * - Detect conflicts (last-write-wins)
     * - Return server changes since last sync
     */
    public DeltaSyncResponse processDeltaSync(DeltaSyncRequest request, String userId) {
        LocalDateTime syncTimestamp = LocalDateTime.now();
        List<DeltaSyncResponse.SyncChange> serverChanges = new ArrayList<>();
        List<DeltaSyncResponse.SyncConflict> conflicts = new ArrayList<>();

        // Get user's team IDs
        List<String> userTeamIds = teamService.getUserTeamIds(userId);

        // Process incoming changes from client
        if (request.getChanges() != null && !request.getChanges().isEmpty()) {
            for (DeltaSyncRequest.SyncChange clientChange : request.getChanges()) {
                try {
                    // Check for conflicts
                    List<SyncLog> existingLogs = syncLogRepository.findByEntityTypeAndEntityId(
                        clientChange.getEntityType(),
                        clientChange.getEntityId()
                    );

                    // Get the most recent server version
                    int serverVersion = existingLogs.isEmpty() ? 0 :
                        existingLogs.stream()
                            .mapToInt(log -> extractVersionFromData(log.getDataSnapshot()))
                            .max()
                            .orElse(0);

                    // Check for conflict
                    if (serverVersion > clientChange.getVersion()) {
                        // Conflict detected - server has newer version
                        String serverData = existingLogs.isEmpty() ? null : existingLogs.get(0).getDataSnapshot();
                        conflicts.add(new DeltaSyncResponse.SyncConflict(
                            clientChange.getEntityType(),
                            clientChange.getEntityId(),
                            clientChange.getVersion(),
                            serverVersion,
                            serverData,
                            clientChange.getData()
                        ));
                        continue; // Skip applying this change
                    }

                    // No conflict - apply change
                    String teamId = extractTeamIdFromData(clientChange.getData());

                    // Create sync log entry
                    SyncLog syncLog = new SyncLog(
                        userId,
                        clientChange.getEntityType(),
                        clientChange.getEntityId(),
                        clientChange.getAction(),
                        teamId,
                        clientChange.getData()
                    );
                    syncLogRepository.save(syncLog);

                    // If this is a task with a teamId, add it to shared_tasks table
                    if ("task".equals(clientChange.getEntityType()) && teamId != null && !teamId.isEmpty()) {
                        if ("create".equals(clientChange.getAction()) || "update".equals(clientChange.getAction())) {
                            // Check if entry already exists
                            if (!sharedTaskRepository.existsByTaskIdAndTeamId(clientChange.getEntityId(), teamId)) {
                                SharedTask sharedTask = new SharedTask(
                                    clientChange.getEntityId(),
                                    teamId,
                                    userId
                                );
                                sharedTaskRepository.save(sharedTask);
                                System.out.println("Added task " + clientChange.getEntityId() + " to shared_tasks for team " + teamId);
                            }
                        } else if ("delete".equals(clientChange.getAction())) {
                            // Remove from shared_tasks if task is deleted
                            sharedTaskRepository.deleteByTaskIdAndTeamId(clientChange.getEntityId(), teamId);
                            System.out.println("Removed task " + clientChange.getEntityId() + " from shared_tasks for team " + teamId);
                        }
                    }

                } catch (Exception e) {
                    // Log error but continue processing
                    System.err.println("Error processing change: " + e.getMessage());
                }
            }
        }

        // Get server changes since last sync
        LocalDateTime lastSyncAt = request.getLastSyncAt() != null ?
            request.getLastSyncAt() : LocalDateTime.now().minusYears(10);

        List<SyncLog> serverSyncLogs = syncLogRepository.findChangesSinceTimestamp(
            userId,
            userTeamIds,
            lastSyncAt
        );

        // Convert sync logs to changes
        for (SyncLog log : serverSyncLogs) {
            // Don't send back changes from this same user (to avoid echo)
            if (!log.getUserId().equals(userId)) {
                int version = extractVersionFromData(log.getDataSnapshot());
                serverChanges.add(new DeltaSyncResponse.SyncChange(
                    log.getEntityType(),
                    log.getEntityId(),
                    log.getAction(),
                    log.getDataSnapshot(),
                    log.getTimestamp(),
                    version
                ));
            }
        }

        return new DeltaSyncResponse(
            serverChanges,
            conflicts,
            syncTimestamp,
            true,
            "Sync completed successfully"
        );
    }

    /**
     * Log a change for delta sync
     */
    public void logChange(String userId, String entityType, String entityId, String action, String teamId, String dataSnapshot) {
        SyncLog syncLog = new SyncLog(userId, entityType, entityId, action, teamId, dataSnapshot);
        syncLogRepository.save(syncLog);
    }

    /**
     * Get changes since a specific timestamp for a user
     */
    public List<DeltaSyncResponse.SyncChange> getChangesSince(String userId, LocalDateTime since) {
        List<String> userTeamIds = teamService.getUserTeamIds(userId);
        List<SyncLog> logs = syncLogRepository.findChangesSinceTimestamp(userId, userTeamIds, since);

        return logs.stream().map(log -> {
            int version = extractVersionFromData(log.getDataSnapshot());
            return new DeltaSyncResponse.SyncChange(
                log.getEntityType(),
                log.getEntityId(),
                log.getAction(),
                log.getDataSnapshot(),
                log.getTimestamp(),
                version
            );
        }).collect(Collectors.toList());
    }

    // Helper methods

    private int extractVersionFromData(String jsonData) {
        if (jsonData == null || jsonData.isEmpty()) {
            return 0;
        }
        try {
            Map<String, Object> data = JsonUtil.fromJson(jsonData, Map.class);
            Object versionObj = data.get("version");
            if (versionObj instanceof Integer) {
                return (Integer) versionObj;
            } else if (versionObj instanceof String) {
                return Integer.parseInt((String) versionObj);
            }
            return 0;
        } catch (Exception e) {
            return 0;
        }
    }

    private String extractTeamIdFromData(String jsonData) {
        if (jsonData == null || jsonData.isEmpty()) {
            return null;
        }
        try {
            Map<String, Object> data = JsonUtil.fromJson(jsonData, Map.class);
            Object teamIdObj = data.get("teamId");
            return teamIdObj != null ? teamIdObj.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
