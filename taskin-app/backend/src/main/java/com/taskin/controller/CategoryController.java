package com.taskin.controller;

import com.taskin.dto.request.CategoryRequest;
import com.taskin.dto.response.CategoryResponse;
import com.taskin.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller para operações com categorias
 */
@RestController
@RequestMapping("/api/categories")
@Tag(name = "Categorias", description = "Operações de gerenciamento de categorias")
@SecurityRequirement(name = "bearerAuth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    /**
     * Listar todas as categorias do usuário
     */
    @GetMapping
    @Operation(summary = "Listar categorias", 
               description = "Retorna todas as categorias ativas do usuário")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de categorias retornada"),
        @ApiResponse(responseCode = "401", description = "Token inválido")
    })
    public ResponseEntity<List<CategoryResponse>> getAllCategories(
            @Parameter(description = "Incluir categorias inativas") 
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        
        try {
            List<CategoryResponse> categories = categoryService.getAllCategories(includeInactive);
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obter categoria por ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Obter categoria por ID", 
               description = "Retorna uma categoria específica do usuário")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Categoria encontrada"),
        @ApiResponse(responseCode = "404", description = "Categoria não encontrada"),
        @ApiResponse(responseCode = "401", description = "Token inválido")
    })
    public ResponseEntity<CategoryResponse> getCategoryById(
            @Parameter(description = "ID da categoria") 
            @PathVariable Long id) {
        
        try {
            CategoryResponse category = categoryService.getCategoryById(id);
            return ResponseEntity.ok(category);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Criar nova categoria
     */
    @PostMapping
    @Operation(summary = "Criar nova categoria", 
               description = "Cria uma nova categoria para o usuário")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Categoria criada com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "401", description = "Token inválido")
    })
    public ResponseEntity<?> createCategory(@Valid @RequestBody CategoryRequest categoryRequest) {
        try {
            CategoryResponse category = categoryService.createCategory(categoryRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(category);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Atualizar categoria
     */
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar categoria", 
               description = "Atualiza uma categoria existente do usuário")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Categoria atualizada com sucesso"),
        @ApiResponse(responseCode = "404", description = "Categoria não encontrada"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "401", description = "Token inválido")
    })
    public ResponseEntity<?> updateCategory(
            @Parameter(description = "ID da categoria") 
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest categoryRequest) {
        
        try {
            CategoryResponse category = categoryService.updateCategory(id, categoryRequest);
            return ResponseEntity.ok(category);
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
     * Excluir categoria
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir categoria", 
               description = "Remove uma categoria do usuário (apenas se não tiver tarefas)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Categoria excluída com sucesso"),
        @ApiResponse(responseCode = "404", description = "Categoria não encontrada"),
        @ApiResponse(responseCode = "400", description = "Categoria possui tarefas associadas"),
        @ApiResponse(responseCode = "401", description = "Token inválido")
    })
    public ResponseEntity<?> deleteCategory(
            @Parameter(description = "ID da categoria") 
            @PathVariable Long id) {
        
        try {
            categoryService.deleteCategory(id);
            return ResponseEntity.noContent().build();
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
     * Obter categorias com estatísticas
     */
    @GetMapping("/with-stats")
    @Operation(summary = "Categorias com estatísticas", 
               description = "Retorna categorias com contagem de tarefas")
    public ResponseEntity<List<Map<String, Object>>> getCategoriesWithStats() {
        try {
            List<Map<String, Object>> categoriesWithStats = categoryService.getCategoriesWithStats();
            return ResponseEntity.ok(categoriesWithStats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Criar categorias padrão
     */
    @PostMapping("/create-defaults")
    @Operation(summary = "Criar categorias padrão", 
               description = "Cria as categorias padrão do sistema para o usuário")
    public ResponseEntity<List<CategoryResponse>> createDefaultCategories() {
        try {
            List<CategoryResponse> categories = categoryService.createDefaultCategories();
            return ResponseEntity.status(HttpStatus.CREATED).body(categories);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Reordenar categorias
     */
    @PatchMapping("/reorder")
    @Operation(summary = "Reordenar categorias", 
               description = "Atualiza a ordem das categorias")
    public ResponseEntity<?> reorderCategories(@RequestBody Map<String, List<Long>> request) {
        try {
            List<Long> categoryIds = request.get("categoryIds");
            if (categoryIds == null || categoryIds.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Lista de IDs é obrigatória");
                return ResponseEntity.badRequest().body(error);
            }

            List<CategoryResponse> reorderedCategories = categoryService.reorderCategories(categoryIds);
            return ResponseEntity.ok(reorderedCategories);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}