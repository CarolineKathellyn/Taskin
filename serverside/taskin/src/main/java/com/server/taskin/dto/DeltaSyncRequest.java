package com.server.taskin.dto;

import java.time.LocalDateTime;
import java.util.List;

public class DeltaSyncRequest {

    private List<SyncChange> changes;
    private LocalDateTime lastSyncAt;

    public DeltaSyncRequest() {}

    public DeltaSyncRequest(List<SyncChange> changes, LocalDateTime lastSyncAt) {
        this.changes = changes;
        this.lastSyncAt = lastSyncAt;
    }

    public List<SyncChange> getChanges() {
        return changes;
    }

    public void setChanges(List<SyncChange> changes) {
        this.changes = changes;
    }

    public LocalDateTime getLastSyncAt() {
        return lastSyncAt;
    }

    public void setLastSyncAt(LocalDateTime lastSyncAt) {
        this.lastSyncAt = lastSyncAt;
    }

    public static class SyncChange {
        private String entityType; // "task", "project", "category"
        private String entityId;
        private String action; // "create", "update", "delete"
        private String data; // JSON string
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
}
