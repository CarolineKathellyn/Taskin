package com.server.taskin.util;

import java.util.regex.Pattern;

public class ValidationUtil {

    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$");

    private static final Pattern PASSWORD_PATTERN =
        Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$");

    public static boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    public static boolean isValidPassword(String password) {
        if (password == null || password.length() < 6) {
            return false;
        }
        return true;
    }

    public static boolean isStrongPassword(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }
        return PASSWORD_PATTERN.matcher(password).matches();
    }

    public static boolean isValidName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return false;
        }
        return name.trim().length() <= 100;
    }

    public static String sanitizeString(String input) {
        if (input == null) {
            return null;
        }
        return input.trim();
    }

    public static boolean isValidJson(String json) {
        if (json == null || json.trim().isEmpty()) {
            return false;
        }

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.readTree(json);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static class ValidationResult {
        private final boolean valid;
        private final String message;

        public ValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public static ValidationResult success() {
            return new ValidationResult(true, null);
        }

        public static ValidationResult error(String message) {
            return new ValidationResult(false, message);
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }
    }

    public static ValidationResult validateLoginRequest(String email, String password) {
        if (!isValidEmail(email)) {
            return ValidationResult.error("Email inválido");
        }
        if (!isValidPassword(password)) {
            return ValidationResult.error("Senha deve ter pelo menos 6 caracteres");
        }
        return ValidationResult.success();
    }

    public static ValidationResult validateRegisterRequest(String email, String password, String name) {
        if (!isValidEmail(email)) {
            return ValidationResult.error("Email inválido");
        }
        if (!isValidPassword(password)) {
            return ValidationResult.error("Senha deve ter pelo menos 6 caracteres");
        }
        if (!isValidName(name)) {
            return ValidationResult.error("Nome inválido ou muito longo");
        }
        return ValidationResult.success();
    }
}