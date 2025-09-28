package com.server.taskin.service;

import com.server.taskin.dto.SyncRequest;
import com.server.taskin.dto.SyncResponse;
import com.server.taskin.model.User;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Service
@Transactional
public class SyncService {

    @Autowired
    private UserService userService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public SyncResponse uploadDatabase(String userId, SyncRequest syncRequest) {
        try {
            User user = userService.findById(userId);

            if (!StringUtils.hasText(syncRequest.getTaskDatabase())) {
                return SyncResponse.error("Dados do banco de tarefas são obrigatórios");
            }

            validateJsonFormat(syncRequest.getTaskDatabase());

            String mergedDatabase = mergeWithExistingData(user.getTaskDatabase(), syncRequest.getTaskDatabase());

            userService.updateTaskDatabase(userId, mergedDatabase);

            return SyncResponse.success(mergedDatabase, LocalDateTime.now());

        } catch (Exception e) {
            return SyncResponse.error("Erro ao fazer upload do banco: " + e.getMessage());
        }
    }

    public SyncResponse downloadDatabase(String userId) {
        try {
            User user = userService.findById(userId);
            String taskDatabase = user.getTaskDatabase();

            if (!StringUtils.hasText(taskDatabase)) {
                taskDatabase = createEmptyDatabase();
            }

            userService.updateLastSyncAt(userId);

            return SyncResponse.success(taskDatabase, LocalDateTime.now());

        } catch (Exception e) {
            return SyncResponse.error("Erro ao fazer download do banco: " + e.getMessage());
        }
    }

    private void validateJsonFormat(String jsonData) {
        try {
            JsonNode node = objectMapper.readTree(jsonData);

            if (!node.has("tasks") || !node.has("categories")) {
                throw new RuntimeException("Formato inválido: deve conter 'tasks' e 'categories'");
            }

        } catch (Exception e) {
            throw new RuntimeException("Formato JSON inválido: " + e.getMessage());
        }
    }

    private String mergeWithExistingData(String existingData, String newData) {
        try {
            if (!StringUtils.hasText(existingData)) {
                return newData;
            }

            JsonNode existingNode = objectMapper.readTree(existingData);
            JsonNode newNode = objectMapper.readTree(newData);

            String mergedData = performMerge(existingNode, newNode);

            return mergedData;

        } catch (Exception e) {
            return newData;
        }
    }

    private String performMerge(JsonNode existingNode, JsonNode newNode) throws Exception {
        return objectMapper.writeValueAsString(newNode);
    }

    private String createEmptyDatabase() {
        try {
            return objectMapper.writeValueAsString(new EmptyDatabase());
        } catch (Exception e) {
            return "{\"tasks\": [], \"categories\": [], \"lastModified\": \"" + LocalDateTime.now() + "\"}";
        }
    }

    private static class EmptyDatabase {
        public Object[] tasks = new Object[0];
        public Object[] categories = new Object[0];
        public String lastModified = LocalDateTime.now().toString();
    }
}