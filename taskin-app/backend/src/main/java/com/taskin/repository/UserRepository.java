// ==================== USER REPOSITORY ====================
// backend/src/main/java/com/taskin/repository/UserRepository.java
package com.taskin.repository;

import com.taskin.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository para operações com usuários
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Busca usuário por email
     */
    Optional<User> findByEmail(String email);

    /**
     * Verifica se email já existe
     */
    boolean existsByEmail(String email);

    /**
     * Busca usuários ativos
     */
    List<User> findByIsActiveTrue();

    /**
     * Busca usuários criados após uma data
     */
    List<User> findByCreatedAtAfter(LocalDateTime date);

    /**
     * Busca usuários por parte do nome (case insensitive)
     */
    @Query("SELECT u FROM User u WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<User> findByNameContainingIgnoreCase(@Param("name") String name);

    /**
     * Conta usuários ativos
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = true")
    long countActiveUsers();

    /**
     * Busca usuários que fizeram login recentemente
     */
    @Query("SELECT u FROM User u WHERE u.lastLogin >= :since")
    List<User> findUsersWithRecentLogin(@Param("since") LocalDateTime since);
}

// ==================== TASK REPOSITORY ====================
// backend/src/main/java/com/taskin/repository/TaskRepository.java
package com.taskin.repository;

import com.taskin.model.Task;
import com.taskin.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository para operações com tarefas
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    /**
     * Busca tarefas por usuário
     */
    List<Task> findByUserOrderByCreatedAtDesc(User user);

    /**
     * Busca tarefas por usuário com paginação
     */
    Page<Task> findByUser(User user, Pageable pageable);

    /**
     * Busca tarefa por ID e usuário
     */
    Optional<Task> findByIdAndUser(Long id, User user);

    /**
     * Busca tarefas por status
     */
    List<Task> findByUserAndStatusOrderByDueDateAsc(User user, Task.TaskStatus status);

    /**
     * Busca tarefas por prioridade
     */
    List<Task> findByUserAndPriorityOrderByDueDateAsc(User user, Task.TaskPriority priority);

    /**
     * Busca tarefas por categoria
     */
    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.category.id = :categoryId ORDER BY t.dueDate ASC")
    List<Task> findByUserAndCategoryId(@Param("user") User user, @Param("categoryId") Long categoryId);

    /**
     * Busca tarefas pendentes
     */
    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.status = 'PENDING' ORDER BY t.dueDate ASC")
    List<Task> findPendingTasks(@Param("user") User user);

    /**
     * Busca tarefas concluídas
     */
    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.status = 'COMPLETED' ORDER BY t.completedAt DESC")
    List<Task> findCompletedTasks(@Param("user") User user);

    /**
     * Busca tarefas vencidas
     */
    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.status != 'COMPLETED' AND t.dueDate < :now ORDER BY t.dueDate ASC")
    List<Task> findOverdueTasks(@Param("user") User user, @Param("now") LocalDateTime now);

    /**
     * Busca tarefas do dia
     */
    @Query("SELECT t FROM Task t WHERE t.user = :user AND DATE(t.dueDate) = DATE(:date) ORDER BY t.dueDate ASC")
    List<Task> findTasksForDate(@Param("user") User user, @Param("date") LocalDateTime date);

    /**
     * Busca tarefas entre datas
     */
    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.dueDate BETWEEN :start AND :end ORDER BY t.dueDate ASC")
    List<Task> findTasksBetweenDates(@Param("user") User user, 
                                   @Param("start") LocalDateTime start, 
                                   @Param("end") LocalDateTime end);

    /**
     * Busca por texto no título ou descrição
     */
    @Query("SELECT t FROM Task t WHERE t.user = :user AND " +
           "(LOWER(t.title) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :searchText, '%'))) " +
           "ORDER BY t.createdAt DESC")
    List<Task> searchTasks(@Param("user") User user, @Param("searchText") String searchText);

    /**
     * Conta tarefas por status
     */
    @Query("SELECT COUNT(t) FROM Task t WHERE t.user = :user AND t.status = :status")
    long countByUserAndStatus(@Param("user") User user, @Param("status") Task.TaskStatus status);

    /**
     * Conta todas as tarefas do usuário
     */
    long countByUser(User user);

    /**
     * Busca tarefas com lembretes ativos
     */
    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.reminderEnabled = true AND t.status != 'COMPLETED'")
    List<Task> findTasksWithReminders(@Param("user") User user);

    /**
     * Busca tarefas por client ID (para sincronização)
     */
    Optional<Task> findByUserAndClientId(User user, String clientId);

    /**
     * Busca tarefas não sincronizadas
     */
    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.syncStatus != 'SYNCED'")
    List<Task> findUnsyncedTasks(@Param("user") User user);

    /**
     * Estatísticas do usuário
     */
    @Query("SELECT " +
           "COUNT(t) as total, " +
           "SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed, " +
           "SUM(CASE WHEN t.status = 'PENDING' THEN 1 ELSE 0 END) as pending, " +
           "SUM(CASE WHEN t.status != 'COMPLETED' AND t.dueDate < :now THEN 1 ELSE 0 END) as overdue, " +
           "SUM(CASE WHEN DATE(t.dueDate) = DATE(:now) AND t.status != 'COMPLETED' THEN 1 ELSE 0 END) as today " +
           "FROM Task t WHERE t.user = :user")
    Object[] getUserTaskStatistics(@Param("user") User user, @Param("now") LocalDateTime now);
}

// ==================== CATEGORY REPOSITORY ====================
// backend/src/main/java/com/taskin/repository/CategoryRepository.java
package com.taskin.repository;

import com.taskin.model.Category;
import com.taskin.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository para operações com categorias
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    /**
     * Busca categorias por usuário
     */
    List<Category> findByUserAndIsActiveTrueOrderBySortOrderAsc(User user);

    /**
     * Busca todas as categorias do usuário (incluindo inativas)
     */
    List<Category> findByUserOrderBySortOrderAsc(User user);

    /**
     * Busca categoria por ID e usuário
     */
    Optional<Category> findByIdAndUser(Long id, User user);

    /**
     * Busca categorias padrão do usuário
     */
    List<Category> findByUserAndIsDefaultTrueOrderBySortOrderAsc(User user);

    /**
     * Busca categorias personalizadas do usuário
     */
    List<Category> findByUserAndIsDefaultFalseAndIsActiveTrueOrderBySortOrderAsc(User user);

    /**
     * Verifica se nome da categoria já existe para o usuário
     */
    boolean existsByUserAndNameIgnoreCase(User user, String name);

    /**
     * Busca categoria por nome e usuário
     */
    Optional<Category> findByUserAndNameIgnoreCase(User user, String name);

    /**
     * Conta categorias ativas do usuário
     */
    long countByUserAndIsActiveTrue(User user);

    /**
     * Busca categorias com tarefas
     */
    @Query("SELECT c FROM Category c WHERE c.user = :user AND c.isActive = true AND SIZE(c.tasks) > 0 ORDER BY c.sortOrder ASC")
    List<Category> findCategoriesWithTasks(@Param("user") User user);

    /**
     * Busca categoria por client ID (para sincronização)
     */
    Optional<Category> findByUserAndClientId(User user, String clientId);

    /**
     * Busca categorias não sincronizadas
     */
    @Query("SELECT c FROM Category c WHERE c.user = :user AND c.syncStatus != 'SYNCED'")
    List<Category> findUnsyncedCategories(@Param("user") User user);

    /**
     * Estatísticas de categorias com contagem de tarefas
     */
    @Query("SELECT c, COUNT(t) as taskCount FROM Category c " +
           "LEFT JOIN c.tasks t " +
           "WHERE c.user = :user AND c.isActive = true " +
           "GROUP BY c " +
           "ORDER BY c.sortOrder ASC")
    List<Object[]> findCategoriesWithTaskCount(@Param("user") User user);
}