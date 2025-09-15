// ==================== TASK REQUEST ====================
// backend/src/main/java/com/taskin/dto/request/TaskRequest.java
package com.taskin.dto.request;

import com.taskin.model.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * DTO para requisições de criação/atualização de tarefas
 */
public class TaskRequest {

    @NotBlank(message = "Título é obrigatório")
    @Size(min = 1, max = 200, message = "Título deve ter entre 1 e 200 caracteres")
    private String title;

    @Size(max = 2000, message = "Descrição deve ter no máximo 2000 caracteres")
    private String description;

    private Task.TaskPriority priority = Task.TaskPriority.MEDIUM;
    private Task.TaskStatus status = Task.TaskStatus.PENDING;
    private LocalDateTime dueDate;
    private Integer estimatedMinutes;
    private String notes;
    private String tags;
    private Boolean isRecurring = false;
    private String recurrencePattern;
    private Boolean reminderEnabled = false;
    private Integer reminderMinutesBefore = 15;
    private Long categoryId;
    
    // Para sincronização offline
    private String clientId;
    private Long version;

    public TaskRequest() {}

    public TaskRequest(String title) {
        this.title = title;
    }

    public TaskRequest(String title, String description, Task.TaskPriority priority) {
        this.title = title;
        this.description = description;
        this.priority = priority;
    }

    // Getters e Setters
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Task.TaskPriority getPriority() {
        return priority;
    }

    public void setPriority(Task.TaskPriority priority) {
        this.priority = priority;
    }

    public Task.TaskStatus getStatus() {
        return status;
    }

    public void setStatus(Task.TaskStatus status) {
        this.status = status;
    }

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }

    public Integer getEstimatedMinutes() {
        return estimatedMinutes;
    }

    public void setEstimatedMinutes(Integer estimatedMinutes) {
        this.estimatedMinutes = estimatedMinutes;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public Boolean getIsRecurring() {
        return isRecurring;
    }

    public void setIsRecurring(Boolean isRecurring) {
        this.isRecurring = isRecurring;
    }

    public String getRecurrencePattern() {
        return recurrencePattern;
    }

    public void setRecurrencePattern(String recurrencePattern) {
        this.recurrencePattern = recurrencePattern;
    }

    public Boolean getReminderEnabled() {
        return reminderEnabled;
    }

    public void setReminderEnabled(Boolean reminderEnabled) {
        this.reminderEnabled = reminderEnabled;
    }

    public Integer getReminderMinutesBefore() {
        return reminderMinutesBefore;
    }

    public void setReminderMinutesBefore(Integer reminderMinutesBefore) {
        this.reminderMinutesBefore = reminderMinutesBefore;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }
}

// ==================== TASK RESPONSE ====================
// backend/src/main/java/com/taskin/dto/response/TaskResponse.java
package com.taskin.dto.response;

import com.taskin.model.Task;
import java.time.LocalDateTime;

/**
 * DTO para resposta de tarefas
 */
public class TaskResponse {

    private Long id;
    private String title;
    private String description;
    private Task.TaskPriority priority;
    private Task.TaskStatus status;
    private LocalDateTime dueDate;
    private LocalDateTime completedAt;
    private Integer estimatedMinutes;
    private Integer actualMinutes;
    private String notes;
    private String tags;
    private Boolean isRecurring;
    private String recurrencePattern;
    private Boolean reminderEnabled;
    private Integer reminderMinutesBefore;
    
    // Informações da categoria
    private CategoryInfo category;
    
    // Informações de auditoria
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Informações de sincronização
    private String clientId;
    private Task.SyncStatus syncStatus;
    private Long version;
    private LocalDateTime lastSyncAt;
    
    // Campos calculados
    private Boolean isCompleted;
    private Boolean isOverdue;
    private Boolean isDueToday;

    public TaskResponse() {}

    public TaskResponse(Task task) {
        this.id = task.getId();
        this.title = task.getTitle();
        this.description = task.getDescription();
        this.priority = task.getPriority();
        this.status = task.getStatus();
        this.dueDate = task.getDueDate();
        this.completedAt = task.getCompletedAt();
        this.estimatedMinutes = task.getEstimatedMinutes();
        this.actualMinutes = task.getActualMinutes();
        this.notes = task.getNotes();
        this.tags = task.getTags();
        this.isRecurring = task.getIsRecurring();
        this.recurrencePattern = task.getRecurrencePattern();
        this.reminderEnabled = task.getReminderEnabled();
        this.reminderMinutesBefore = task.getReminderMinutesBefore();
        this.createdAt = task.getCreatedAt();
        this.updatedAt = task.getUpdatedAt();
        this.clientId = task.getClientId();
        this.syncStatus = task.getSyncStatus();
        this.version = task.getVersion();
        this.lastSyncAt = task.getLastSyncAt();
        
        // Campos calculados
        this.isCompleted = task.isCompleted();
        this.isOverdue = task.isOverdue();
        this.isDueToday = task.isDueToday();
        
        // Categoria
        if (task.getCategory() != null) {
            this.category = new CategoryInfo(task.getCategory());
        }
    }

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Task.TaskPriority getPriority() {
        return priority;
    }

    public void setPriority(Task.TaskPriority priority) {
        this.priority = priority;
    }

    public Task.TaskStatus getStatus() {
        return status;
    }

    public void setStatus(Task.TaskStatus status) {
        this.status = status;
    }

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public Integer getEstimatedMinutes() {
        return estimatedMinutes;
    }

    public void setEstimatedMinutes(Integer estimatedMinutes) {
        this.estimatedMinutes = estimatedMinutes;
    }

    public Integer getActualMinutes() {
        return actualMinutes;
    }

    public void setActualMinutes(Integer actualMinutes) {
        this.actualMinutes = actualMinutes;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public Boolean getIsRecurring() {
        return isRecurring;
    }

    public void setIsRecurring(Boolean isRecurring) {
        this.isRecurring = isRecurring;
    }

    public String getRecurrencePattern() {
        return recurrencePattern;
    }

    public void setRecurrencePattern(String recurrencePattern) {
        this.recurrencePattern = recurrencePattern;
    }

    public Boolean getReminderEnabled() {
        return reminderEnabled;
    }

    public void setReminderEnabled(Boolean reminderEnabled) {
        this.reminderEnabled = reminderEnabled;
    }

    public Integer getReminderMinutesBefore() {
        return reminderMinutesBefore;
    }

    public void setReminderMinutesBefore(Integer reminderMinutesBefore) {
        this.reminderMinutesBefore = reminderMinutesBefore;
    }

    public CategoryInfo getCategory() {
        return category;
    }

    public void setCategory(CategoryInfo category) {
        this.category = category;
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

    public Boolean getIsCompleted() {
        return isCompleted;
    }

    public void setIsCompleted(Boolean isCompleted) {
        this.isCompleted = isCompleted;
    }

    public Boolean getIsOverdue() {
        return isOverdue;
    }

    public void setIsOverdue(Boolean isOverdue) {
        this.isOverdue = isOverdue;
    }

    public Boolean getIsDueToday() {
        return isDueToday;
    }

    public void setIsDueToday(Boolean isDueToday) {
        this.isDueToday = isDueToday;
    }

    /**
     * Classe interna para informações da categoria
     */
    public static class CategoryInfo {
        private Long id;
        private String name;
        private String color;
        private String icon;
        private Boolean isDefault;

        public CategoryInfo() {}

        public CategoryInfo(com.taskin.model.Category category) {
            this.id = category.getId();
            this.name = category.getName();
            this.color = category.getColor();
            this.icon = category.getIcon();
            this.isDefault = category.getIsDefault();
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
    }
}