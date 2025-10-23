package com.server.taskin.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

@Entity
@Table(name = "shared_projects", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"project_id", "team_id"})
})
public class SharedProject {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank(message = "ID do projeto é obrigatório")
    @Column(name = "project_id", nullable = false)
    private String projectId;

    @NotBlank(message = "ID da equipe é obrigatório")
    @Column(name = "team_id", nullable = false)
    private String teamId;

    @NotBlank(message = "Criador do compartilhamento é obrigatório")
    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "shared_at", nullable = false, updatable = false)
    private LocalDateTime sharedAt;

    public SharedProject() {}

    public SharedProject(String projectId, String teamId, String createdBy) {
        this.projectId = projectId;
        this.teamId = teamId;
        this.createdBy = createdBy;
        this.sharedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        this.sharedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getTeamId() {
        return teamId;
    }

    public void setTeamId(String teamId) {
        this.teamId = teamId;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getSharedAt() {
        return sharedAt;
    }

    public void setSharedAt(LocalDateTime sharedAt) {
        this.sharedAt = sharedAt;
    }
}
