package com.server.taskin.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

@Entity
@Table(name = "team_members", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"team_id", "user_id"})
})
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @NotBlank(message = "ID do usuário é obrigatório")
    @Column(name = "user_id", nullable = false)
    private String userId;

    @NotBlank(message = "Função do membro é obrigatória")
    @Column(nullable = false)
    private String role; // "owner" or "member"

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    public TeamMember() {}

    public TeamMember(Team team, String userId, String role) {
        this.team = team;
        this.userId = userId;
        this.role = role;
        this.joinedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        this.joinedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Team getTeam() {
        return team;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
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
