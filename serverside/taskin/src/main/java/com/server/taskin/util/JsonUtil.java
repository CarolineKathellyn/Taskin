package com.server.taskin.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.time.LocalDateTime;

public class JsonUtil {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static boolean isValidJson(String json) {
        try {
            objectMapper.readTree(json);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static JsonNode parseJson(String json) throws JsonProcessingException {
        return objectMapper.readTree(json);
    }

    public static String toJsonString(Object object) throws JsonProcessingException {
        return objectMapper.writeValueAsString(object);
    }

    public static <T> T fromJson(String json, Class<T> valueType) throws JsonProcessingException {
        return objectMapper.readValue(json, valueType);
    }

    public static boolean hasRequiredFields(JsonNode jsonNode, String... fields) {
        for (String field : fields) {
            if (!jsonNode.has(field)) {
                return false;
            }
        }
        return true;
    }

    public static JsonNode addTimestamp(JsonNode jsonNode) {
        if (jsonNode instanceof ObjectNode) {
            ObjectNode objectNode = (ObjectNode) jsonNode;
            objectNode.put("lastModified", LocalDateTime.now().toString());
        }
        return jsonNode;
    }

    public static String createEmptyTaskDatabase() {
        try {
            ObjectNode emptyDb = objectMapper.createObjectNode();
            emptyDb.set("tasks", objectMapper.createArrayNode());
            emptyDb.set("categories", objectMapper.createArrayNode());
            emptyDb.put("lastModified", LocalDateTime.now().toString());
            return objectMapper.writeValueAsString(emptyDb);
        } catch (Exception e) {
            return "{\"tasks\":[],\"categories\":[],\"lastModified\":\"" + LocalDateTime.now() + "\"}";
        }
    }

    public static JsonNode mergeJsonObjects(JsonNode existing, JsonNode newData) {
        try {
            if (existing == null || existing.isNull()) {
                return newData;
            }

            if (newData == null || newData.isNull()) {
                return existing;
            }

            return addTimestamp(newData);

        } catch (Exception e) {
            return newData;
        }
    }

    public static ValidationUtil.ValidationResult validateTaskDatabase(String jsonData) {
        try {
            JsonNode node = parseJson(jsonData);

            if (!hasRequiredFields(node, "tasks", "categories")) {
                return ValidationUtil.ValidationResult.error(
                    "JSON deve conter os campos 'tasks' e 'categories'"
                );
            }

            if (!node.get("tasks").isArray()) {
                return ValidationUtil.ValidationResult.error(
                    "Campo 'tasks' deve ser um array"
                );
            }

            if (!node.get("categories").isArray()) {
                return ValidationUtil.ValidationResult.error(
                    "Campo 'categories' deve ser um array"
                );
            }

            return ValidationUtil.ValidationResult.success();

        } catch (Exception e) {
            return ValidationUtil.ValidationResult.error(
                "JSON inválido: " + e.getMessage()
            );
        }
    }
}