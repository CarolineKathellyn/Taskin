package com.taskin.controller;

import com.taskin.dto.request.TaskRequest;
import com.taskin.dto.response.TaskResponse;
import com.taskin.service.TaskService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller para operações com tarefas
 * 
 * Endpoints:
 * - GET /api/tasks - Listar tarefas
 * - GET /api/tasks/{id} - Obter tarefa por ID
 * - POST /api/tasks - Criar nova tarefa
 * - PUT /api/tasks/{id} - Atualizar tarefa
 * - DELETE /api/tasks/{id} - Excluir tarefa
 * - PATCH /api/tasks/{id}/status - Alterar status da tarefa
 * - GET /api/tasks/search - Buscar tarefas
 * - GET /api/tasks/statistics - Estatísticas do usuário
 */
@RestController
@RequestMapping("/api/tasks")
@Tag(name = "Tarefas", description = "Operações de gerenciamento de tarefas")
@SecurityRequirement(name = "bearerAuth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TaskController {

    @Autowired
    private TaskService taskService;

    /**
     * Listar todas as tarefas do usuário
     */
    @GetMapping
    @Operation(summary = "Listar tarefas", 
               description = "Retorna todas as tarefas do usuário autenticado com filtros opcionais")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de tarefas retornada"),
        @ApiResponse(responseCode = "401", description = "Token inválido")
    })
    public ResponseEntity<Page<TaskResponse>> getAllTasks(
            @Parameter(description = "Número da página (0-indexed)") 
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Tamanho da página") 
            @RequestParam(defaultValue = "20") int size,
            
            @Parameter(description = "Campo para ordenação") 
            @RequestParam(defaultValue = "createdAt") String sortBy,
            
            @Parameter(description = "Direção da ordenação (ASC/DESC)") 
            @RequestParam(defaultValue = "DESC") String sortDir,
            
            @Parameter(description = "Filtrar por status") 
            @RequestParam(required = false) String status,
            
            @Parameter(description = "Filtrar por prioridade") 
            @RequestParam(required = false) String priority,
            
            @Parameter(description = "Filtrar por categoria") 
            @RequestParam(required = false) Long categoryId,
            
            @Parameter(description = "Filtrar por data (today, overdue, week)") 
            @RequestParam(required = false) String dateFilter) {

        try {
            Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);

            Page<TaskResponse> tasks = taskService.getAllTasks(
                pageable, status, priority, categoryId, dateFilter);

            return ResponseEntity.ok(tasks);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obter tarefa por ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Obter tarefa por ID", 
               description = "Retorna uma tarefa específica do usuário")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tarefa encontrada"),
        @ApiResponse(responseCode = "404", description = "Tarefa não encontrada"),
        @ApiResponse(responseCode = "401", description = "Token inválido")
    })
    public ResponseEntity<TaskResponse> getTaskById(
            @Parameter(description = "ID da tarefa") 
            @PathVariable Long id) {
        
        try {
            TaskResponse task = taskService.getTaskById(id);
            return ResponseEntity.ok(task);

        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Criar nova tarefa
     */
    @PostMapping
    @Operation(summary = "Criar nova tarefa", 
               description = "Cria uma nova tarefa para o usuário autenticado")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Tarefa criada com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "401", description = "Token inválido")
    })
    public ResponseEntity<?> createTask(@Valid @RequestBody TaskRequest taskRequest) {
        try {
            TaskResponse task = taskService.createTask(taskRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(task);

        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Atualizar tarefa
     */
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar tarefa", 
               description = "Atualiza uma tarefa existente do usuário")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tarefa atualizada com sucesso"),
        @ApiResponse(responseCode = "404", description = "Tarefa não encontrada"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "401", description = "Token inválido")
    })
    public ResponseEntity<?> updateTask(
            @Parameter(description = "ID da tarefa") 
            @PathVariable Long id,
            @Valid @RequestBody TaskRequest taskRequest) {
        
        try {
            TaskResponse task = taskService.updateTask(id, taskRequest);
            return ResponseEntity.ok(task);

        } catch (RuntimeException e) {
            if (e.getMessage().contains("não encontrada")) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Excluir tarefa
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir tarefa", 
               description = "Remove uma tarefa do usuário")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Tarefa excluída com sucesso"),
        @ApiResponse(responseCode = "404", description = "Tarefa não encontrada"),
        @ApiResponse(responseCode = "401", description = "Token inválido")
    })
    public ResponseEntity<Void> deleteTask(
            @Parameter(description = "ID da tarefa") 
            @PathVariable Long id) {
        
        try {
            taskService.deleteTask(id);
            return ResponseEntity.noContent().build();

        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Alterar status da tarefa
     */
    @PatchMapping("/{id}/status")
    @Operation(summary = "Alterar status da tarefa", 
               description = "Atualiza apenas o status de uma tarefa")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status atualizado com sucesso"),
        @ApiResponse(responseCode = "404", description = "Tarefa não encontrada"),
        @ApiResponse(responseCode = "400", description = "Status inválido"),
        @ApiResponse(responseCode = "401", description = "Token inválido")
    })
    public ResponseEntity<?> updateTaskStatus(
            @Parameter(description = "ID da tarefa") 
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate) {
        
        try {
            String newStatus = statusUpdate.get("status");
            if (newStatus == null || newStatus.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Status é obrigatório");
                return ResponseEntity.badRequest().body(error);
            }

            TaskResponse task = taskService.updateTaskStatus(id, newStatus);
            return ResponseEntity.ok(task);

        } catch (RuntimeException e) {
            if (e.getMessage().contains("não encontrada")) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Buscar tarefas por texto
     */
    @GetMapping("/search")
    @Operation(summary = "Buscar tarefas", 
               description = "Busca tarefas por texto no título ou descrição")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Resultados da busca"),
        @ApiResponse(responseCode = "401", description = "Token inválido")
    })
    public ResponseEntity<List<TaskResponse>> searchTasks(
            @Parameter(description = "Texto para busca") 
            @RequestParam String query,
            
            @Parameter(description = "Limite de resultados") 
            @RequestParam(defaultValue = "50") int limit) {
        
        try {
            List<TaskResponse> tasks = taskService.searchTasks(query, limit);
            return ResponseEntity.ok(tasks);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obter estatísticas das tarefas do usuário
     */
    @GetMapping("/statistics")
    @Operation(summary = "Estatísticas de tarefas", 
               description = "Retorna estatísticas detalhadas das tarefas do usuário")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Estatísticas retornadas"),
        @ApiResponse(responseCode = "401", description = "Token inválido")
    })
    public ResponseEntity<Map<String, Object>> getTaskStatistics() {
        try {
            Map<String, Object> statistics = taskService.getTaskStatistics();
            return ResponseEntity.ok(statistics);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obter tarefas por categoria
     */
    @GetMapping("/by-category/{categoryId}")
    @Operation(summary = "Tarefas por categoria", 
               description = "Retorna todas as tarefas de uma categoria específica")
    public ResponseEntity<List<TaskResponse>> getTasksByCategory(
            @Parameter(description = "ID da categoria") 
            @PathVariable Long categoryId) {
        
        try {
            List<TaskResponse> tasks = taskService.getTasksByCategory(categoryId);
            return ResponseEntity.ok(tasks);

        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Obter tarefas do dia
     */
    @GetMapping("/today")
    @Operation(summary = "Tarefas de hoje", 
               description = "Retorna todas as tarefas com vencimento hoje")
    public ResponseEntity<List<TaskResponse>> getTodayTasks() {
        try {
            List<TaskResponse> tasks = taskService.getTodayTasks();
            return ResponseEntity.ok(tasks);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obter tarefas vencidas
     */
    @GetMapping("/overdue")
    @Operation(summary = "Tarefas vencidas", 
               description = "Retorna todas as tarefas vencidas do usuário")
    public ResponseEntity<List<TaskResponse>> getOverdueTasks() {
        try {
            List<TaskResponse> tasks = taskService.getOverdueTasks();
            return ResponseEntity.ok(tasks);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obter tarefas pendentes
     */
    @GetMapping("/pending")
    @Operation(summary = "Tarefas pendentes", 
               description = "Retorna todas as tarefas pendentes do usuário")
    public ResponseEntity<List<TaskResponse>> getPendingTasks() {
        try {
            List<TaskResponse> tasks = taskService.getPendingTasks();
            return ResponseEntity.ok(tasks);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obter tarefas concluídas
     */
    @GetMapping("/completed")
    @Operation(summary = "Tarefas concluídas", 
               description = "Retorna todas as tarefas concluídas do usuário")
    public ResponseEntity<List<TaskResponse>> getCompletedTasks() {
        try {
            List<TaskResponse> tasks = taskService.getCompletedTasks();
            return ResponseEntity.ok(tasks);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Marcar múltiplas tarefas como concluídas
     */
    @PatchMapping("/bulk/complete")
    @Operation(summary = "Completar múltiplas tarefas", 
               description = "Marca múltiplas tarefas como concluídas")
    public ResponseEntity<?> completeMultipleTasks(@RequestBody Map<String, List<Long>> request) {
        try {
            List<Long> taskIds = request.get("taskIds");
            if (taskIds == null || taskIds.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Lista de IDs é obrigatória");
                return ResponseEntity.badRequest().body(error);
            }

            List<TaskResponse> updatedTasks = taskService.completeMultipleTasks(taskIds);
            return ResponseEntity.ok(updatedTasks);

        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Duplicar tarefa
     */
    @PostMapping("/{id}/duplicate")
    @Operation(summary = "Duplicar tarefa", 
               description = "Cria uma cópia de uma tarefa existente")
    public ResponseEntity<?> duplicateTask(
            @Parameter(description = "ID da tarefa a ser duplicada") 
            @PathVariable Long id) {
        
        try {
            TaskResponse duplicatedTask = taskService.duplicateTask(id);
            return ResponseEntity.status(HttpStatus.CREATED).body(duplicatedTask);

        } catch (RuntimeException e) {
            if (e.getMessage().contains("não encontrada")) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
