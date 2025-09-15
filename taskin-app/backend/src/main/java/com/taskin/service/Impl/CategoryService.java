package com.taskin.service;

import com.taskin.dto.request.CategoryRequest;
import com.taskin.dto.response.CategoryResponse;

import java.util.List;
import java.util.Map;

/**
 * Interface do serviço de categorias
 */
public interface CategoryService {
    
    /**
     * Obtém todas as categorias do usuário
     */
    List<CategoryResponse> getAllCategories(boolean includeInactive);
    
    /**
     * Obtém categoria por ID
     */
    CategoryResponse getCategoryById(Long id);
    
    /**
     * Cria nova categoria
     */
    CategoryResponse createCategory(CategoryRequest categoryRequest);
    
    /**
     * Atualiza categoria existente
     */
    CategoryResponse updateCategory(Long id, CategoryRequest categoryRequest);
    
    /**
     * Exclui categoria
     */
    void deleteCategory(Long id);
    
    /**
     * Obtém categorias com estatísticas
     */
    List<Map<String, Object>> getCategoriesWithStats();
    
    /**
     * Cria categorias padrão
     */
    List<CategoryResponse> createDefaultCategories();
    
    /**
     * Reordena categorias
     */
    List<CategoryResponse> reorderCategories(List<Long> categoryIds);
}

// ==================== IMPLEMENTAÇÃO ====================
// backend/src/main/java/com/taskin/service/impl/CategoryServiceImpl.java
package com.taskin.service.impl;

import com.taskin.dto.request.CategoryRequest;
import com.taskin.dto.response.CategoryResponse;
import com.taskin.model.Category;
import com.taskin.model.User;
import com.taskin.repository.CategoryRepository;
import com.taskin.service.CategoryService;
import com.taskin.service.impl.AuthServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implementação do serviço de categorias
 */
@Service
@Transactional
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private AuthServiceImpl authService;

    @Override
    public List<CategoryResponse> getAllCategories(boolean includeInactive) {
        User currentUser = authService.getCurrentUserEntity();
        
        List<Category> categories;
        if (includeInactive) {
            categories = categoryRepository.findByUserOrderBySortOrderAsc(currentUser);
        } else {
            categories = categoryRepository.findByUserAndIsActiveTrueOrderBySortOrderAsc(currentUser);
        }
        
        return categories.stream()
                        .map(CategoryResponse::new)
                        .collect(Collectors.toList());
    }

    @Override
    public CategoryResponse getCategoryById(Long id) {
        User currentUser = authService.getCurrentUserEntity();
        
        Category category = categoryRepository.findByIdAndUser(id, currentUser)
            .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
            
        return new CategoryResponse(category);
    }

    @Override
    public CategoryResponse createCategory(CategoryRequest categoryRequest) {
        User currentUser = authService.getCurrentUserEntity();
        
        // Verificar se já existe categoria com o mesmo nome
        if (categoryRepository.existsByUserAndNameIgnoreCase(currentUser, categoryRequest.getName())) {
            throw new RuntimeException("Já existe uma categoria com este nome");
        }
        
        Category category = new Category();
        category.setName(categoryRequest.getName());
        category.setDescription(categoryRequest.getDescription());
        category.setColor(categoryRequest.getColor());
        category.setIcon(categoryRequest.getIcon());
        category.setIsActive(categoryRequest.getIsActive());
        category.setSortOrder(categoryRequest.getSortOrder());
        category.setClientId(categoryRequest.getClientId());
        category.setUser(currentUser);
        
        // Se não foi definida ordem, colocar no final
        if (category.getSortOrder() == null || category.getSortOrder() == 0) {
            long maxOrder = categoryRepository.countByUserAndIsActiveTrue(currentUser);
            category.setSortOrder((int) maxOrder);
        }
        
        category = categoryRepository.save(category);
        
        return new CategoryResponse(category);
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryRequest categoryRequest) {
        User currentUser = authService.getCurrentUserEntity();
        
        Category category = categoryRepository.findByIdAndUser(id, currentUser)
            .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
        
        // Verificar se nome já existe (exceto para a própria categoria)
        categoryRepository.findByUserAndNameIgnoreCase(currentUser, categoryRequest.getName())
            .ifPresent(existingCategory -> {
                if (!existingCategory.getId().equals(id)) {
                    throw new RuntimeException("Já existe uma categoria com este nome");
                }
            });
        
        // Atualizar campos
        category.setName(categoryRequest.getName());
        category.setDescription(categoryRequest.getDescription());
        category.setColor(categoryRequest.getColor());
        category.setIcon(categoryRequest.getIcon());
        category.setIsActive(categoryRequest.getIsActive());
        
        if (categoryRequest.getSortOrder() != null) {
            category.setSortOrder(categoryRequest.getSortOrder());
        }
        
        // Marcar para sincronização
        category.markForSync();
        
        category = categoryRepository.save(category);
        
        return new CategoryResponse(category);
    }

    @Override
    public void deleteCategory(Long id) {
        User currentUser = authService.getCurrentUserEntity();
        
        Category category = categoryRepository.findByIdAndUser(id, currentUser)
            .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
        
        // Verificar se é categoria padrão
        if (category.getIsDefault()) {
            throw new RuntimeException("Não é possível excluir categorias padrão do sistema");
        }
        
        categoryRepository.delete(category);
    }

    @Override
    public List<Map<String, Object>> getCategoriesWithStats() {
        User currentUser = authService.getCurrentUserEntity();
        
        List<Object[]> results = categoryRepository.findCategoriesWithTaskCount(currentUser);
        List<Map<String, Object>> categoriesWithStats = new ArrayList<>();
        
        for (Object[] result : results) {
            Category category = (Category) result[0];
            Long taskCount = (Long) result[1];
            
            Map<String, Object> categoryMap = new HashMap<>();
            categoryMap.put("id", category.getId());
            categoryMap.put("name", category.getName());
            categoryMap.put("description", category.getDescription());
            categoryMap.put("color", category.getColor());
            categoryMap.put("icon", category.getIcon());
            categoryMap.put("isDefault", category.getIsDefault());
            categoryMap.put("isActive", category.getIsActive());
            categoryMap.put("sortOrder", category.getSortOrder());
            categoryMap.put("taskCount", taskCount);
            categoryMap.put("completedTaskCount", category.getCompletedTaskCount());
            categoryMap.put("pendingTaskCount", category.getPendingTaskCount());
            categoryMap.put("createdAt", category.getCreatedAt());
            
            categoriesWithStats.add(categoryMap);
        }
        
        return categoriesWithStats;
    }

    @Override
    public List<CategoryResponse> createDefaultCategories() {
        User currentUser = authService.getCurrentUserEntity();
        
        // Verificar se já existem categorias padrão
        List<Category> existingDefaults = categoryRepository.findByUserAndIsDefaultTrueOrderBySortOrderAsc(currentUser);
        if (!existingDefaults.isEmpty()) {
            throw new RuntimeException("Categorias padrão já foram criadas para este usuário");
        }
        
        // Criar categorias padrão
        List<Category> defaultCategories = Category.DefaultCategories.createDefaultCategories(currentUser);
        List<Category> savedCategories = categoryRepository.saveAll(defaultCategories);
        
        return savedCategories.stream()
                             .map(CategoryResponse::new)
                             .collect(Collectors.toList());
    }

    @Override
    public List<CategoryResponse> reorderCategories(List<Long> categoryIds) {
        User currentUser = authService.getCurrentUserEntity();
        List<CategoryResponse> reorderedCategories = new ArrayList<>();
        
        for (int i = 0; i < categoryIds.size(); i++) {
            Long categoryId = categoryIds.get(i);
            
            Category category = categoryRepository.findByIdAndUser(categoryId, currentUser)
                .orElseThrow(() -> new RuntimeException("Categoria " + categoryId + " não encontrada"));
            
            category.setSortOrder(i);
            category.markForSync();
            
            category = categoryRepository.save(category);
            reorderedCategories.add(new CategoryResponse(category));
        }
        
        return reorderedCategories;
    }
}