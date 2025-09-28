package com.server.taskin.dto;

import java.time.LocalDateTime;

public class SyncResponse {

    private String taskDatabase;
    private LocalDateTime lastSyncAt;
    private String message;
    private boolean success;

    public SyncResponse() {}

    public SyncResponse(String taskDatabase, LocalDateTime lastSyncAt, String message, boolean success) {
        this.taskDatabase = taskDatabase;
        this.lastSyncAt = lastSyncAt;
        this.message = message;
        this.success = success;
    }

    public static SyncResponse success(String taskDatabase, LocalDateTime lastSyncAt) {
        return new SyncResponse(taskDatabase, lastSyncAt, "Sincronização realizada com sucesso", true);
    }

    public static SyncResponse error(String message) {
        return new SyncResponse(null, null, message, false);
    }

    public String getTaskDatabase() {
        return taskDatabase;
    }

    public void setTaskDatabase(String taskDatabase) {
        this.taskDatabase = taskDatabase;
    }

    public LocalDateTime getLastSyncAt() {
        return lastSyncAt;
    }

    public void setLastSyncAt(LocalDateTime lastSyncAt) {
        this.lastSyncAt = lastSyncAt;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }
}