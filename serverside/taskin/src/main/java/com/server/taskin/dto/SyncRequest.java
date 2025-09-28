package com.server.taskin.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public class SyncRequest {

    @NotBlank(message = "Dados do banco de tarefas são obrigatórios")
    private String taskDatabase;

    private LocalDateTime lastSyncAt;

    public SyncRequest() {}

    public SyncRequest(String taskDatabase, LocalDateTime lastSyncAt) {
        this.taskDatabase = taskDatabase;
        this.lastSyncAt = lastSyncAt;
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
}