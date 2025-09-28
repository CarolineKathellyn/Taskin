package com.server.taskin.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex, WebRequest request) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ErrorResponse errorResponse = new ErrorResponse(
            "Erro de validação",
            "Dados inválidos fornecidos",
            HttpStatus.BAD_REQUEST.value(),
            request.getDescription(false),
            errors
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUsernameNotFoundException(
            UsernameNotFoundException ex, WebRequest request) {

        ErrorResponse errorResponse = new ErrorResponse(
            "Usuário não encontrado",
            ex.getMessage(),
            HttpStatus.NOT_FOUND.value(),
            request.getDescription(false),
            null
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentialsException(
            BadCredentialsException ex, WebRequest request) {

        ErrorResponse errorResponse = new ErrorResponse(
            "Credenciais inválidas",
            "Email ou senha incorretos",
            HttpStatus.UNAUTHORIZED.value(),
            request.getDescription(false),
            null
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(
            RuntimeException ex, WebRequest request) {

        ErrorResponse errorResponse = new ErrorResponse(
            "Erro na aplicação",
            ex.getMessage(),
            HttpStatus.BAD_REQUEST.value(),
            request.getDescription(false),
            null
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, WebRequest request) {

        ErrorResponse errorResponse = new ErrorResponse(
            "Erro interno do servidor",
            "Ocorreu um erro inesperado. Tente novamente mais tarde.",
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            request.getDescription(false),
            null
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    public static class ErrorResponse {
        private String title;
        private String message;
        private int status;
        private String path;
        private LocalDateTime timestamp;
        private Map<String, String> errors;

        public ErrorResponse(String title, String message, int status, String path, Map<String, String> errors) {
            this.title = title;
            this.message = message;
            this.status = status;
            this.path = path;
            this.timestamp = LocalDateTime.now();
            this.errors = errors;
        }

        public String getTitle() {
            return title;
        }

        public String getMessage() {
            return message;
        }

        public int getStatus() {
            return status;
        }

        public String getPath() {
            return path;
        }

        public LocalDateTime getTimestamp() {
            return timestamp;
        }

        public Map<String, String> getErrors() {
            return errors;
        }
    }
}