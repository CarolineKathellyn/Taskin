package com.taskin.controller;

import com.taskin.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller para dashboard e estatísticas
 */
@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "Estatísticas e visão geral do usuário")
@SecurityRequirement(name = "bearerAuth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    /**
     * Obter estatísticas gerais do dashboard
     */
    @GetMapping("/stats")
    @Operation(summary = "Estatísticas do dashboard", 
               description = "Retorna estatísticas gerais de produtividade do usuário")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Estatísticas retornadas"),
        @ApiResponse(responseCode = "401", description = "Token inválido")
    })
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        try {
            Map<String, Object> stats = dashboardService.getDashboardStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obter resumo de atividades recentes
     */
    @GetMapping("/recent-activity")
    @Operation(summary = "Atividades recentes", 
               description = "Retorna atividades recentes do usuário")
    public ResponseEntity<Map<String, Object>> getRecentActivity() {
        try {
            Map<String, Object> activity = dashboardService.getRecentActivity();
            return ResponseEntity.ok(activity);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obter estatísticas por período
     */
    @GetMapping("/stats/period")
    @Operation(summary = "Estatísticas por período", 
               description = "Retorna estatísticas para um período específico")
    public ResponseEntity<Map<String, Object>> getStatsByPeriod(
            @RequestParam(defaultValue = "7") int days) {
        try {
            Map<String, Object> stats = dashboardService.getStatisticsByPeriod(days);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obter tarefas para hoje
     */
    @GetMapping("/today")
    @Operation(summary = "Resumo do dia", 
               description = "Retorna resumo das tarefas para hoje")
    public ResponseEntity<Map<String, Object>> getTodaySummary() {
        try {
            Map<String, Object> summary = dashboardService.getTodaySummary();
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

// ==================== DASHBOARD SERVICE ====================
package com.taskin.service;

import java.util.Map;

/**
 * Interface do serviço de dashboard
 */
public interface DashboardService {
    
    /**
     * Obtém estatísticas gerais do dashboard
     */
    Map<String, Object> getDashboardStatistics();
    
    /**
     * Obtém atividades recentes
     */
    Map<String, Object> getRecentActivity();
    
    /**
     * Obtém estatísticas por período
     */
    Map<String, Object> getStatisticsByPeriod(int days);
    
    /**
     * Obtém resumo do dia
     */
    Map<String, Object> getTodaySummary();
}

// ==================== IMPLEMENTAÇÃO ====================
package com.taskin.service.impl;

import com.taskin.dto.response.TaskResponse;
import com.taskin.model.Task;
import com.taskin.model.User;
import com.taskin.repository.CategoryRepository;
import com.taskin.repository.TaskRepository;
import com.taskin.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implementação do serviço de dashboard
 */
@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private AuthServiceImpl authService;

    @Override
    public Map<String, Object> getDashboardStatistics() {
        User currentUser = authService.getCurrentUserEntity();
        LocalDateTime now = LocalDateTime.now();
        
        Map<String, Object> stats = new HashMap<>();
        
        // Estatísticas básicas
        long totalTasks = taskRepository.countByUser(currentUser);
        long completedTasks = taskRepository.countByUserAndStatus(currentUser, Task.TaskStatus.COMPLETED);
        long pendingTasks = taskRepository.countByUserAndStatus(currentUser, Task.TaskStatus.PENDING);
        long inProgressTasks = taskRepository.countByUserAndStatus(currentUser, Task.TaskStatus.IN_PROGRESS);
        
        // Tarefas por data
        List<Task> todayTasks = taskRepository.findTasksForDate(currentUser, now);
        List<Task> overdueTasks = taskRepository.findOverdueTasks(currentUser, now);
        
        // Tarefas desta semana
        LocalDateTime weekStart = now.truncatedTo(ChronoUnit.DAYS).minusDays(now.getDayOfWeek().getValue() - 1);
        LocalDateTime weekEnd = weekStart.plusDays(7);
        List<Task> weekTasks = taskRepository.findTasksBetweenDates(currentUser, weekStart, weekEnd);
        
        stats.put("totalTasks", totalTasks);
        stats.put("completedTasks", completedTasks);
        stats.put("pendingTasks", pendingTasks);
        stats.put("inProgressTasks", inProgressTasks);
        stats.put("todayTasks", todayTasks.size());
        stats.put("overdueTasks", overdueTasks.size());
        stats.put("weekTasks", weekTasks.size());
        
        // Percentual de conclusão
        if (totalTasks > 0) {
            double completionRate = (double) completedTasks / totalTasks * 100;
            stats.put("completionRate", Math.round(completionRate * 100.0) / 100.0);
        } else {
            stats.put("completionRate", 0.0);
        }
        
        // Produtividade da semana
        long weekCompleted = weekTasks.stream()
            .filter(Task::isCompleted)
            .count();
        
        if (weekTasks.size() > 0) {
            double weeklyProductivity = (double) weekCompleted / weekTasks.size() * 100;
            stats.put("weeklyProductivity", Math.round(weeklyProductivity * 100.0) / 100.0);
        } else {
            stats.put("weeklyProductivity", 0.0);
        }
        
        // Estatísticas por prioridade
        Map<String, Long> priorityStats = new HashMap<>();
        for (Task.TaskPriority priority : Task.TaskPriority.values()) {
            long count = taskRepository.findByUserAndPriorityOrderByDueDateAsc(currentUser, priority).size();
            priorityStats.put(priority.name().toLowerCase(), count);
        }
        stats.put("byPriority", priorityStats);
        
        // Total de categorias
        long totalCategories = categoryRepository.countByUserAndIsActiveTrue(currentUser);
        stats.put("totalCategories", totalCategories);
        
        return stats;
    }

    @Override
    public Map<String, Object> getRecentActivity() {
        User currentUser = authService.getCurrentUserEntity();
        LocalDateTime last7Days = LocalDateTime.now().minusDays(7);
        
        Map<String, Object> activity = new HashMap<>();
        
        // Tarefas criadas recentemente
        List<Task> recentTasks = taskRepository.findTasksBetweenDates(
            currentUser, last7Days, LocalDateTime.now())
            .stream()
            .limit(10)
            .collect(Collectors.toList());
        
        // Tarefas concluídas recentemente
        List<Task> recentCompleted = taskRepository.findCompletedTasks(currentUser)
            .stream()
            .filter(task -> task.getCompletedAt() != null && 
                           task.getCompletedAt().isAfter(last7Days))
            .limit(10)
            .collect(Collectors.toList());
        
        activity.put("recentTasks", recentTasks.stream()
            .map(TaskResponse::new)
            .collect(Collectors.toList()));
            
        activity.put("recentCompleted", recentCompleted.stream()
            .map(TaskResponse::new)
            .collect(Collectors.toList()));
        
        return activity;
    }

    @Override
    public Map<String, Object> getStatisticsByPeriod(int days) {
        User currentUser = authService.getCurrentUserEntity();
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        LocalDateTime endDate = LocalDateTime.now();
        
        Map<String, Object> stats = new HashMap<>();
        
        // Tarefas no período
        List<Task> periodTasks = taskRepository.findTasksBetweenDates(currentUser, startDate, endDate);
        
        long totalInPeriod = periodTasks.size();
        long completedInPeriod = periodTasks.stream()
            .filter(Task::isCompleted)
            .count();
        
        stats.put("totalTasks", totalInPeriod);
        stats.put("completedTasks", completedInPeriod);
        stats.put("pendingTasks", totalInPeriod - completedInPeriod);
        
        if (totalInPeriod > 0) {
            double productivityRate = (double) completedInPeriod / totalInPeriod * 100;
            stats.put("productivityRate", Math.round(productivityRate * 100.0) / 100.0);
        } else {
            stats.put("productivityRate", 0.0);
        }
        
        stats.put("period", days);
        stats.put("startDate", startDate);
        stats.put("endDate", endDate);
        
        return stats;
    }

    @Override
    public Map<String, Object> getTodaySummary() {
        User currentUser = authService.getCurrentUserEntity();
        LocalDateTime today = LocalDateTime.now();
        
        Map<String, Object> summary = new HashMap<>();
        
        // Tarefas de hoje
        List<Task> todayTasks = taskRepository.findTasksForDate(currentUser, today);
        List<Task> overdueTasks = taskRepository.findOverdueTasks(currentUser, today);
        
        // Separar por status
        List<Task> todayPending = todayTasks.stream()
            .filter(task -> task.getStatus() == Task.TaskStatus.PENDING)
            .collect(Collectors.toList());
            
        List<Task> todayInProgress = todayTasks.stream()
            .filter(task -> task.getStatus() == Task.TaskStatus.IN_PROGRESS)
            .collect(Collectors.toList());
            
        List<Task> todayCompleted = todayTasks.stream()
            .filter(task -> task.getStatus() == Task.TaskStatus.COMPLETED)
            .collect(Collectors.toList());
        
        summary.put("todayTotal", todayTasks.size());
        summary.put("todayPending", todayPending.size());
        summary.put("todayInProgress", todayInProgress.size());
        summary.put("todayCompleted", todayCompleted.size());
        summary.put("overdueTotal", overdueTasks.size());
        
        // Próximas tarefas (prioritárias)
        List<Task> upcomingHighPriority = todayPending.stream()
            .filter(task -> task.getPriority() == Task.TaskPriority.HIGH || 
                           task.getPriority() == Task.TaskPriority.URGENT)
            .limit(5)
            .collect(Collectors.toList());
        
        summary.put("upcomingHighPriority", upcomingHighPriority.stream()
            .map(TaskResponse::new)
            .collect(Collectors.toList()));
        
        // Progresso do dia
        if (todayTasks.size() > 0) {
            double dailyProgress = (double) todayCompleted.size() / todayTasks.size() * 100;
            summary.put("dailyProgress", Math.round(dailyProgress * 100.0) / 100.0);
        } else {
            summary.put("dailyProgress", 0.0);
        }
        
        return summary;
    }
}
}
