package com.server.taskin.dto;

import java.time.LocalDateTime;

public class AuthResponse {

    private String token;
    private String type = "Bearer";
    private String userId;
    private String email;
    private String name;
    private long expiresIn;
    private LocalDateTime expiresAt;

    public AuthResponse() {}

    public AuthResponse(String token, String userId, String email, String name, long expiresIn) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.expiresIn = expiresIn;
        this.expiresAt = LocalDateTime.now().plusSeconds(expiresIn / 1000);
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
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

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
        this.expiresAt = LocalDateTime.now().plusSeconds(expiresIn / 1000);
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}