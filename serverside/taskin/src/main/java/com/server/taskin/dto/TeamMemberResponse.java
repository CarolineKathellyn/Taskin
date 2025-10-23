package com.server.taskin.dto;

import java.time.LocalDateTime;

public class TeamMemberResponse {

    private String id;
    private String userId;
    private String email;
    private String name;
    private String role;
    private LocalDateTime joinedAt;

    public TeamMemberResponse() {}

    public TeamMemberResponse(String id, String userId, String email, String name, String role, LocalDateTime joinedAt) {
        this.id = id;
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.role = role;
        this.joinedAt = joinedAt;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }
}
