package com.server.taskin.dto;

import com.server.taskin.model.Team;

import java.time.LocalDateTime;
import java.util.List;

public class TeamResponse {

    private String id;
    private String name;
    private String description;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int memberCount;
    private String userRole; // "owner" or "member"

    public TeamResponse() {}

    public TeamResponse(Team team, int memberCount, String userRole) {
        this.id = team.getId();
        this.name = team.getName();
        this.description = team.getDescription();
        this.createdBy = team.getCreatedBy();
        this.createdAt = team.getCreatedAt();
        this.updatedAt = team.getUpdatedAt();
        this.memberCount = memberCount;
        this.userRole = userRole;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public int getMemberCount() {
        return memberCount;
    }

    public void setMemberCount(int memberCount) {
        this.memberCount = memberCount;
    }

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }
}
