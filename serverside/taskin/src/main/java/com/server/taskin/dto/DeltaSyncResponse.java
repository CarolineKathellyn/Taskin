package com.server.taskin.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class DeltaSyncResponse {

    private List<SyncChange> changes = new ArrayList<>();
    private List<SyncConflict> conflicts = new ArrayList<>();
    private LocalDateTime lastSyncAt;
    private boolean success;
    private String message;

    public DeltaSyncResponse() {}

    public DeltaSyncResponse(List<SyncChange> changes, List<SyncConflict> conflicts, LocalDateTime lastSyncAt, boolean success, String message) {
        this.changes = changes;
        this.conflicts = conflicts;
        this.lastSyncAt = lastSyncAt;
        this.success = success;
        this.message = message;
    }

    // Getters and Setters
    public List<SyncChange> getChanges() {
        return changes;
    }

    public void setChanges(List<SyncChange> changes) {
        this.changes = changes;
    }

    public List<SyncConflict> getConflicts() {
        return conflicts;
    }

    public void setConflicts(List<SyncConflict> conflicts) {
        this.conflicts = conflicts;
    }

    public LocalDateTime getLastSyncAt() {
        return lastSyncAt;
    }

    public void setLastSyncAt(LocalDateTime lastSyncAt) {
        this.lastSyncAt = lastSyncAt;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public static class SyncChange {
        private String entityType;
        private String entityId;
        private String action;
        private String data;
        private LocalDateTime timestamp;
        private int version;

        public SyncChange() {}

        public SyncChange(String entityType, String entityId, String action, String data, LocalDateTime timestamp, int version) {
            this.entityType = entityType;
            this.entityId = entityId;
            this.action = action;
            this.data = data;
            this.timestamp = timestamp;
            this.version = version;
        }

        // Getters and Setters
        public String getEntityType() {
            return entityType;
        }

        public void setEntityType(String entityType) {
            this.entityType = entityType;
        }

        public String getEntityId() {
            return entityId;
        }

        public void setEntityId(String entityId) {
            this.entityId = entityId;
        }

        public String getAction() {
            return action;
        }

        public void setAction(String action) {
            this.action = action;
        }

        public String getData() {
            return data;
        }

        public void setData(String data) {
            this.data = data;
        }

        public LocalDateTime getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }

        public int getVersion() {
            return version;
        }

        public void setVersion(int version) {
            this.version = version;
        }
    }

    public static class SyncConflict {
        private String entityType;
        private String entityId;
        private int localVersion;
        private int serverVersion;
        private String serverData;
        private String localData;

        public SyncConflict() {}

        public SyncConflict(String entityType, String entityId, int localVersion, int serverVersion, String serverData, String localData) {
            this.entityType = entityType;
            this.entityId = entityId;
            this.localVersion = localVersion;
            this.serverVersion = serverVersion;
            this.serverData = serverData;
            this.localData = localData;
        }

        // Getters and Setters
        public String getEntityType() {
            return entityType;
        }

        public void setEntityType(String entityType) {
            this.entityType = entityType;
        }

        public String getEntityId() {
            return entityId;
        }

        public void setEntityId(String entityId) {
            this.entityId = entityId;
        }

        public int getLocalVersion() {
            return localVersion;
        }

        public void setLocalVersion(int localVersion) {
            this.localVersion = localVersion;
        }

        public int getServerVersion() {
            return serverVersion;
        }

        public void setServerVersion(int serverVersion) {
            this.serverVersion = serverVersion;
        }

        public String getServerData() {
            return serverData;
        }

        public void setServerData(String serverData) {
            this.serverData = serverData;
        }

        public String getLocalData() {
            return localData;
        }

        public void setLocalData(String localData) {
            this.localData = localData;
        }
    }
}
