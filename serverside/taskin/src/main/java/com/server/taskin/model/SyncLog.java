package com.server.taskin.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

@Entity
@Table(name = "sync_logs", indexes = {
    @Index(name = "idx_sync_user_timestamp", columnList = "user_id,timestamp"),
    @Index(name = "idx_sync_entity", columnList = "entity_type,entity_id")
})
public class SyncLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank(message = "ID do usuário é obrigatório")
    @Column(name = "user_id", nullable = false)
    private String userId;

    @NotBlank(message = "Tipo de entidade é obrigatório")
    @Column(name = "entity_type", nullable = false)
    private String entityType; // "task", "project", "category"

    @NotBlank(message = "ID da entidade é obrigatório")
    @Column(name = "entity_id", nullable = false)
    private String entityId;

    @NotBlank(message = "Ação é obrigatória")
    @Column(nullable = false)
    private String action; // "create", "update", "delete"

    @Column(name = "team_id")
    private String teamId;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "data_snapshot", columnDefinition = "TEXT")
    private String dataSnapshot; // JSON snapshot of the entity at this point

    public SyncLog() {}

    public SyncLog(String userId, String entityType, String entityId, String action, String teamId, String dataSnapshot) {
        this.userId = userId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.teamId = teamId;
        this.dataSnapshot = dataSnapshot;
        this.timestamp = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

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

    public String getTeamId() {
        return teamId;
    }

    public void setTeamId(String teamId) {
        this.teamId = teamId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getDataSnapshot() {
        return dataSnapshot;
    }

    public void setDataSnapshot(String dataSnapshot) {
        this.dataSnapshot = dataSnapshot;
    }
}
