// ==================== CATEGORY REQUEST ====================
// backend/src/main/java/com/taskin/dto/request/CategoryRequest.java
package com.taskin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO para requisições de criação/atualização de categorias
 */
public class CategoryRequest {

    @NotBlank(message = "Nome da categoria é obrigatório")
    @Size(min = 1, max = 50, message = "Nome deve ter entre 1 e 50 caracteres")
    private String name;

    @Size(max = 200, message = "Descrição deve ter no máximo 200 caracteres")
    private String description;

    @Pattern(regexp = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", 
             message = "Cor deve estar no formato hexadecimal (#RRGGBB ou #RGB)")
    private String color = "#6366F1";

    private String icon = "folder";
    private Boolean isActive = true;
    private Integer sortOrder = 0;
    
    // Para sincronização offline
    private String clientId;

    public CategoryRequest() {}

    public CategoryRequest(String name, String color) {
        this.name = name;
        this.color = color;
    }

    public CategoryRequest(String name, String description, String color, String icon) {
        this.name = name;
        this.description = description;
        this.color = color;
        this.icon = icon;
    }

    // Getters e Setters
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

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }
}

// ==================== CATEGORY RESPONSE ====================
// backend/src/main/java/com/taskin/dto/response/CategoryResponse.java
package com.taskin.dto.response;

import com.taskin.model.Category;
import com.taskin.model.Task;
import java.time.LocalDateTime;

/**
 * DTO para resposta de categorias
 */
public class CategoryResponse {

    private Long id;
    private String name;
    private String description;
    private String color;
    private String icon;
    private Boolean isDefault;
    private Boolean isActive;
    private Integer sortOrder;
    
    // Estatísticas
    private Long taskCount;
    private Long completedTaskCount;
    private Long pendingTaskCount;
    
    // Informações de auditoria
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Informações de sincronização
    private String clientId;
    private Task.SyncStatus syncStatus;
    private Long version;
    private LocalDateTime lastSyncAt;

    public CategoryResponse() {}

    public CategoryResponse(Category category) {
        this.id = category.getId();
        this.name = category.getName();
        this.description = category.getDescription();
        this.color = category.getColor();
        this.icon = category.getIcon();
        this.isDefault = category.getIsDefault();
        this.isActive = category.getIsActive();
        this.sortOrder = category.getSortOrder();
        this.createdAt = category.getCreatedAt();
        this.updatedAt = category.getUpdatedAt();
        this.clientId = category.getClientId();
        this.syncStatus = category.getSyncStatus();
        this.version = category.getVersion();
        this.lastSyncAt = category.getLastSyncAt();
        
        // Calcular estatísticas
        this.taskCount = category.getTaskCount();
        this.completedTaskCount = category.getCompletedTaskCount();
        this.pendingTaskCount = category.getPendingTaskCount();
    }

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
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

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Long getTaskCount() {
        return taskCount;
    }

    public void setTaskCount(Long taskCount) {
        this.taskCount = taskCount;
    }

    public Long getCompletedTaskCount() {
        return completedTaskCount;
    }

    public void setCompletedTaskCount(Long completedTaskCount) {
        this.completedTaskCount = completedTaskCount;
    }

    public Long getPendingTaskCount() {
        return pendingTaskCount;
    }

    public void setPendingTaskCount(Long pendingTaskCount) {
        this.pendingTaskCount = pendingTaskCount;
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

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public Task.SyncStatus getSyncStatus() {
        return syncStatus;
    }

    public void setSyncStatus(Task.SyncStatus syncStatus) {
        this.syncStatus = syncStatus;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public LocalDateTime getLastSyncAt() {
        return lastSyncAt;
    }

    public void setLastSyncAt(LocalDateTime lastSyncAt) {
        this.lastSyncAt = lastSyncAt;
    }
}
