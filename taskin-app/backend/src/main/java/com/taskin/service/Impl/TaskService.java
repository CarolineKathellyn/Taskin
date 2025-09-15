package com.taskin.service;

import com.taskin.dto.request.TaskRequest;
import com.taskin.dto.response.TaskResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

/**
 * Interface do serviço de tarefas
 */
public interface TaskService {
    
    /**
     * Obtém todas as tarefas do usuário com filtros
     */
    Page<TaskResponse> getAllTasks(Pageable pageable, String status, String priority, 
                                  Long categoryId, String dateFilter);
    
    /**
     * Obtém tarefa por ID
     */
    TaskResponse getTaskById(Long id);
    
    /**
     * Cria nova tarefa
     */
    TaskResponse createTask(TaskRequest taskRequest);
    
    /**
     * Atualiza tarefa existente
     */
    TaskResponse updateTask(Long id, TaskRequest taskRequest);
    
    /**
     * Exclui tarefa
     */
    void deleteTask(Long id);
    
    /**
     * Atualiza status da tarefa
     */
    TaskResponse updateTaskStatus(Long id, String status);
    
    /**
     * Busca tarefas por texto
     */
    List<TaskResponse> searchTasks(String query, int limit);
    
    /**
     * Obtém estatísticas das tarefas
     */
    Map<String, Object> getTaskStatistics();
    
    /**
     * Obtém tarefas por categoria
     */
    List<TaskResponse> getTasksByCategory(Long categoryId);
    
    /**
     * Obtém tarefas de hoje
     */
    List<TaskResponse> getTodayTasks();
    
    /**
     * Obtém tarefas vencidas
     */
    List<TaskResponse> getOverdueTasks();
    
    /**
     * Obtém tarefas pendentes
     */
    List<TaskResponse> getPendingTasks();
    
    /**
     * Obtém tarefas concluídas
     */
    List<TaskResponse> getCompletedTasks();
    
    /**
     * Completa múltiplas tarefas
     */
    List<TaskResponse> completeMultipleTasks(List<Long> taskIds);
    
    /**
     * Duplica tarefa
     */
    TaskResponse duplicateTask(Long id);
}

// ==================== IMPLEMENTAÇÃO ====================
// backend/src/main/java/com/taskin/service/impl/TaskServiceImpl.java
package com.taskin.service.Impl;

import com.taskin.dto.request.TaskRequest;
import com.taskin.dto.response.TaskResponse;
import com.taskin.model.Category;
import com.taskin.model.Task;
import com.taskin.model.User;
import com.taskin.repository.CategoryRepository;
import com.taskin.repository.TaskRepository;
import com.taskin.service.TaskService;
import com.taskin.service.impl.AuthServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implementação do serviço de tarefas
 */
@Service
@Transactional
public class TaskServiceImpl implements TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private AuthServiceImpl authService;

    @Override
    public Page<TaskResponse> getAllTasks(Pageable pageable, String status, String priority, 
                                         Long categoryId, String dateFilter) {
        User currentUser = authService.getCurrentUserEntity();
        
        // Por enquanto, implementação básica sem filtros
        // TODO: Implementar filtros complexos com Specifications
        Page<Task> tasks = taskRepository.findByUser(currentUser, pageable);
        
        return tasks.map(TaskResponse::new);
    }

    @Override
    public TaskResponse getTaskById(Long id) {
        User currentUser = authService.getCurrentUserEntity();
        
        Task task = taskRepository.findByIdAndUser(id, currentUser)
            .orElseThrow(() -> new RuntimeException("Tarefa não encontrada"));
            
        return new TaskResponse(task);
    }

    @Override
    public TaskResponse createTask(TaskRequest taskRequest) {
        User currentUser = authService.getCurrentUserEntity();
        
        Task task = new Task();
        task.setTitle(taskRequest.getTitle());
        task.setDescription(taskRequest.getDescription());
        task.setPriority(taskRequest.getPriority());
        task.setStatus(taskRequest.getStatus());
        task.setDueDate(taskRequest.getDueDate());
        task.setEstimatedMinutes(taskRequest.getEstimatedMinutes());
        task.setNotes(taskRequest.getNotes());
        task.setTags(taskRequest.getTags());
        task.setIsRecurring(taskRequest.getIsRecurring());
        task.setRecurrencePattern(taskRequest.getRecurrencePattern());
        task.setReminderEnabled(taskRequest.getReminderEnabled());
        task.setReminderMinutesBefore(taskRequest.getReminderMinutesBefore());
        task.setClientId(taskRequest.getClientId());
        task.setUser(currentUser);
        
        // Associar categoria se fornecida
        if (taskRequest.getCategoryId() != null) {
            Category category = categoryRepository.findByIdAndUser(taskRequest.getCategoryId(), currentUser)
                .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
            task.setCategory(category);
        }
        
        task = taskRepository.save(task);
        
        return new TaskResponse(task);
    }

    @Override
    public TaskResponse updateTask(Long id, TaskRequest taskRequest) {
        User currentUser = authService.getCurrentUserEntity();
        
        Task task = taskRepository.findByIdAndUser(id, currentUser)
            .orElseThrow(() -> new RuntimeException("Tarefa não encontrada"));
        
        // Atualizar campos
        task.setTitle(taskRequest.getTitle());
        task.setDescription(taskRequest.getDescription());
        task.setPriority(taskRequest.getPriority());
        task.setStatus(taskRequest.getStatus());
        task.setDueDate(taskRequest.getDueDate());
        task.setEstimatedMinutes(taskRequest.getEstimatedMinutes());
        task.setNotes(taskRequest.getNotes());
        task.setTags(taskRequest.getTags());
        task.setIsRecurring(taskRequest.getIsRecurring());
        task.setRecurrencePattern(taskRequest.getRecurrencePattern());
        task.setReminderEnabled(taskRequest.getReminderEnabled());
        task.setReminderMinutesBefore(taskRequest.getReminderMinutesBefore());
        
        // Atualizar categoria
        if (taskRequest.getCategoryId() != null) {
            Category category = categoryRepository.findByIdAndUser(taskRequest.getCategoryId(), currentUser)
                .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
            task.setCategory(category);
        } else {
            task.setCategory(null);
        }
        
        // Marcar para sincronização
        task.markForSync();
        
        task = taskRepository.save(task);
        
        return new TaskResponse(task);
    }

    @Override
    public void deleteTask(Long id) {
        User currentUser = authService.getCurrentUserEntity();
        
        Task task = taskRepository.findByIdAndUser(id, currentUser)
            .orElseThrow(() -> new RuntimeException("Tarefa não encontrada"));
        
        taskRepository.delete(task);
    }

    @Override
    public TaskResponse updateTaskStatus(Long id, String status) {
        User currentUser = authService.getCurrentUserEntity();
        
        Task task = taskRepository.findByIdAndUser(id, currentUser)
            .orElseThrow(() -> new RuntimeException("Tarefa não encontrada"));
        
        try {
            Task.TaskStatus newStatus = Task.TaskStatus.valueOf(status.toUpperCase());
            task.setStatus(newStatus);
            
            // Marcar para sincronização
            task.markForSync();
            
            task = taskRepository.save(task);
            
            return new TaskResponse(task);
            
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Status inválido: " + status);
        }
    }

    @Override
    public List<TaskResponse> searchTasks(String query, int limit) {
        User currentUser = authService.getCurrentUserEntity();
        
        List<Task> tasks = taskRepository.searchTasks(currentUser, query);
        
        return tasks.stream()
                   .limit(limit)
                   .map(TaskResponse::new)
                   .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getTaskStatistics() {
        User currentUser = authService.getCurrentUserEntity();
        LocalDateTime now = LocalDateTime.now();
        
        Map<String, Object> statistics = new HashMap<>();
        
        // Estatísticas básicas
        long totalTasks = taskRepository.countByUser(currentUser);
        long completedTasks = taskRepository.countByUserAndStatus(currentUser, Task.TaskStatus.COMPLETED);
        long pendingTasks = taskRepository.countByUserAndStatus(currentUser, Task.TaskStatus.PENDING);
        
        // Tarefas de hoje e vencidas
        List<Task> todayTasks = taskRepository.findTasksForDate(currentUser, now);
        List<Task> overdueTasks = taskRepository.findOverdueTasks(currentUser, now);
        
        statistics.put("total", totalTasks);
        statistics.put("completed", completedTasks);
        statistics.put("pending", pendingTasks);
        statistics.put("today", todayTasks.size());
        statistics.put("overdue", overdueTasks.size());
        
        // Percentual de conclusão
        if (totalTasks > 0) {
            double completionRate = (double) completedTasks / totalTasks * 100;
            statistics.put("completionRate", Math.round(completionRate * 100.0) / 100.0);
        } else {
            statistics.put("completionRate", 0.0);
        }
        
        // Estatísticas por prioridade
        Map<String, Long> priorityStats = new HashMap<>();
        priorityStats.put("high", taskRepository.countByUserAndStatus(currentUser, Task.TaskStatus.PENDING));
        // TODO: Implementar contagens por prioridade específica
        statistics.put("byPriority", priorityStats);
        
        return statistics;
    }

    @Override
    public List<TaskResponse> getTasksByCategory(Long categoryId) {
        User currentUser = authService.getCurrentUserEntity();
        
        // Verificar se categoria pertence ao usuário
        categoryRepository.findByIdAndUser(categoryId, currentUser)
            .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
        
        List<Task> tasks = taskRepository.findByUserAndCategoryId(currentUser, categoryId);
        
        return tasks.stream()
                   .map(TaskResponse::new)
                   .collect(Collectors.toList());
    }

    @Override
    public List<TaskResponse> getTodayTasks() {
        User currentUser = authService.getCurrentUserEntity();
        
        List<Task> tasks = taskRepository.findTasksForDate(currentUser, LocalDateTime.now());
        
        return tasks.stream()
                   .map(TaskResponse::new)
                   .collect(Collectors.toList());
    }

    @Override
    public List<TaskResponse> getOverdueTasks() {
        User currentUser = authService.getCurrentUserEntity();
        
        List<Task> tasks = taskRepository.findOverdueTasks(currentUser, LocalDateTime.now());
        
        return tasks.stream()
                   .map(TaskResponse::new)
                   .collect(Collectors.toList());
    }

    @Override
    public List<TaskResponse> getPendingTasks() {
        User currentUser = authService.getCurrentUserEntity();
        
        List<Task> tasks = taskRepository.findPendingTasks(currentUser);
        
        return tasks.stream()
                   .map(TaskResponse::new)
                   .collect(Collectors.toList());
    }

    @Override
    public List<TaskResponse> getCompletedTasks() {
        User currentUser = authService.getCurrentUserEntity();
        
        List<Task> tasks = taskRepository.findCompletedTasks(currentUser);
        
        return tasks.stream()
                   .map(TaskResponse::new)
                   .collect(Collectors.toList());
    }

    @Override
    public List<TaskResponse> completeMultipleTasks(List<Long> taskIds) {
        User currentUser = authService.getCurrentUserEntity();
        List<TaskResponse> updatedTasks = new ArrayList<>();
        
        for (Long taskId : taskIds) {
            try {
                Task task = taskRepository.findByIdAndUser(taskId, currentUser)
                    .orElseThrow(() -> new RuntimeException("Tarefa " + taskId + " não encontrada"));
                
                task.markAsCompleted();
                task.markForSync();
                
                task = taskRepository.save(task);
                updatedTasks.add(new TaskResponse(task));
                
            } catch (RuntimeException e) {
                // Log do erro mas continua processando outras tarefas
                System.err.println("Erro ao completar tarefa " + taskId + ": " + e.getMessage());
            }
        }
        
        return updatedTasks;
    }

    @Override
    public TaskResponse duplicateTask(Long id) {
        User currentUser = authService.getCurrentUserEntity();
        
        Task originalTask = taskRepository.findByIdAndUser(id, currentUser)
            .orElseThrow(() -> new RuntimeException("Tarefa não encontrada"));
        
        // Criar nova tarefa baseada na original
        Task duplicatedTask = new Task();
        duplicatedTask.setTitle(originalTask.getTitle() + " (Cópia)");
        duplicatedTask.setDescription(originalTask.getDescription());
        duplicatedTask.setPriority(originalTask.getPriority());
        duplicatedTask.setStatus(Task.TaskStatus.PENDING); // Sempre criar como pendente
        duplicatedTask.setDueDate(originalTask.getDueDate());
        duplicatedTask.setEstimatedMinutes(originalTask.getEstimatedMinutes());
        duplicatedTask.setNotes(originalTask.getNotes());
        duplicatedTask.setTags(originalTask.getTags());
        duplicatedTask.setIsRecurring(originalTask.getIsRecurring());
        duplicatedTask.setRecurrencePattern(originalTask.getRecurrencePattern());
        duplicatedTask.setReminderEnabled(originalTask.getReminderEnabled());
        duplicatedTask.setReminderMinutesBefore(originalTask.getReminderMinutesBefore());
        duplicatedTask.setUser(currentUser);
        duplicatedTask.setCategory(originalTask.getCategory());
        
        duplicatedTask = taskRepository.save(duplicatedTask);
        
        return new TaskResponse(duplicatedTask);
    }
}