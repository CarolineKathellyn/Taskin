package com.taskin.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidade Category - Representa uma categoria de tarefas no sistema Taskin
 * 
 * Permite organizar tarefas em grupos lógicos com cores e ícones personalizados
 */
@Entity
@Table(name = "categories")
@EntityListeners(AuditingEntityListener.class)
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Nome da categoria é obrigatório")
    @Size(min = 1, max = 50, message = "Nome deve ter entre 1 e 50 caracteres")
    @Column(name = "name", nullable = false)
    private String name;

    @Size(max = 200, message = "Descrição deve ter no máximo 200 caracteres")
    @Column(name = "description")
    private String description;

    @Pattern(regexp = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", 
             message = "Cor deve estar no formato hexadecimal (#RRGGBB ou #RGB)")
    @Column(name = "color", nullable = false)
    private String color = "#6366F1"; // Indigo padrão

    @Column(name = "icon")
    private String icon = "folder"; // Ícone padrão

    @Column(name = "is_default")
    private Boolean isDefault = false;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    // Campos para sincronização
    @Column(name = "client_id")
    private String clientId;

    @Column(name = "sync_status")
    @Enumerated(EnumType.STRING)
    private Task.SyncStatus syncStatus = Task.SyncStatus.SYNCED;

    @Column(name = "version")
    private Long version = 1L;

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relacionamentos
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Task> tasks = new ArrayList<>();

    // Construtores
    public Category() {}

    public Category(String name, String color, User user) {
        this.name = name;
        this.color = color;
        this.user = user;
    }

    public Category(String name, String description, String color, String icon, User user) {
        this.name = name;
        this.description = description;
        this.color = color;
        this.icon = icon;
        this.user = user;
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public List<Task> getTasks() {
        return tasks;
    }

    public void setTasks(List<Task> tasks) {
        this.tasks = tasks;
    }

    // Métodos auxiliares
    public void addTask(Task task) {
        tasks.add(task);
        task.setCategory(this);
    }

    public void removeTask(Task task) {
        tasks.remove(task);
        task.setCategory(null);
    }

    public long getTaskCount() {
        return tasks.size();
    }

    public long getCompletedTaskCount() {
        return tasks.stream()
                   .filter(Task::isCompleted)
                   .count();
    }

    public long getPendingTaskCount() {
        return tasks.stream()
                   .filter(task -> !task.isCompleted())
                   .count();
    }

    // Métodos para sincronização
    public void markForSync() {
        this.syncStatus = Task.SyncStatus.PENDING_SYNC;
        this.version++;
    }

    public void markAsSynced() {
        this.syncStatus = Task.SyncStatus.SYNCED;
        this.lastSyncAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "Category{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", color='" + color + '\'' +
                ", icon='" + icon + '\'' +
                ", isDefault=" + isDefault +
                ", isActive=" + isActive +
                '}';
    }

    // Categorias padrão do sistema
    public static class DefaultCategories {
        public static final String WORK_NAME = "Trabalho";
        public static final String WORK_COLOR = "#3B82F6";
        public static final String WORK_ICON = "briefcase";

        public static final String PERSONAL_NAME = "Pessoal";
        public static final String PERSONAL_COLOR = "#10B981";
        public static final String PERSONAL_ICON = "person";

        public static final String STUDY_NAME = "Estudos";
        public static final String STUDY_COLOR = "#8B5CF6";
        public static final String STUDY_ICON = "book";

        public static final String HEALTH_NAME = "Saúde";
        public static final String HEALTH_COLOR = "#F59E0B";
        public static final String HEALTH_ICON = "heart";

        public static final String HOME_NAME = "Casa";
        public static final String HOME_COLOR = "#EF4444";
        public static final String HOME_ICON = "home";

        public static final String FINANCE_NAME = "Finanças";
        public static final String FINANCE_COLOR = "#06B6D4";
        public static final String FINANCE_ICON = "card";

        public static final String SHOPPING_NAME = "Compras";
        public static final String SHOPPING_COLOR = "#EC4899";
        public static final String SHOPPING_ICON = "bag";

        public static List<Category> createDefaultCategories(User user) {
            List<Category> categories = new ArrayList<>();
            
            categories.add(new Category(WORK_NAME, "Tarefas relacionadas ao trabalho", 
                          WORK_COLOR, WORK_ICON, user));
            categories.add(new Category(PERSONAL_NAME, "Tarefas pessoais e familiares", 
                          PERSONAL_COLOR, PERSONAL_ICON, user));
            categories.add(new Category(STUDY_NAME, "Estudos e aprendizado", 
                          STUDY_COLOR, STUDY_ICON, user));
            categories.add(new Category(HEALTH_NAME, "Cuidados com a saúde", 
                          HEALTH_COLOR, HEALTH_ICON, user));
            categories.add(new Category(HOME_NAME, "Tarefas domésticas", 
                          HOME_COLOR, HOME_ICON, user));
            categories.add(new Category(FINANCE_NAME, "Gestão financeira", 
                          FINANCE_COLOR, FINANCE_ICON, user));
            categories.add(new Category(SHOPPING_NAME, "Lista de compras", 
                          SHOPPING_COLOR, SHOPPING_ICON, user));
            
            // Marcar todas como padrão
            categories.forEach(category -> {
                category.setIsDefault(true);
                category.setSortOrder(categories.indexOf(category));
            });
            
            return categories;
        }
    }
}