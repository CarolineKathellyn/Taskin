package com.server.taskin.controller;

import com.server.taskin.dto.AuthResponse;
import com.server.taskin.dto.LoginRequest;
import com.server.taskin.dto.RegisterRequest;
import com.server.taskin.dto.UpdateUserRequest;
import com.server.taskin.dto.ChangePasswordRequest;
import com.server.taskin.model.User;
import com.server.taskin.service.AuthService;
import com.server.taskin.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@Tag(name = "Autenticação", description = "Endpoints para autenticação de usuários")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    @Operation(summary = "Login do usuário", description = "Autentica o usuário com email e senha, retorna JWT token")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login realizado com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))),
        @ApiResponse(responseCode = "400", description = "Credenciais inválidas",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse authResponse = authService.login(loginRequest);
            return ResponseEntity.ok(authResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Erro no login: " + e.getMessage()));
        }
    }

    @Operation(summary = "Registro de usuário", description = "Registra um novo usuário no sistema")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usuário registrado com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))),
        @ApiResponse(responseCode = "400", description = "Dados inválidos ou email já em uso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            AuthResponse authResponse = authService.register(registerRequest);
            return ResponseEntity.ok(authResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Erro no registro: " + e.getMessage()));
        }
    }

    @Operation(summary = "Validar token JWT", description = "Valida se um token JWT ainda é válido")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Token validado",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = TokenValidationResponse.class))),
        @ApiResponse(responseCode = "400", description = "Token inválido ou header mal formado",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                boolean isValid = authService.validateToken(token);

                if (isValid) {
                    String username = authService.getUsernameFromToken(token);
                    return ResponseEntity.ok(new TokenValidationResponse(true, username));
                } else {
                    return ResponseEntity.ok(new TokenValidationResponse(false, null));
                }
            }

            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Header Authorization inválido"));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Erro na validação do token: " + e.getMessage()));
        }
    }

    private static class ErrorResponse {
        private String message;
        private long timestamp;

        public ErrorResponse(String message) {
            this.message = message;
            this.timestamp = System.currentTimeMillis();
        }

        public String getMessage() {
            return message;
        }

        public long getTimestamp() {
            return timestamp;
        }
    }

    private static class TokenValidationResponse {
        private boolean valid;
        private String username;

        public TokenValidationResponse(boolean valid, String username) {
            this.valid = valid;
            this.username = username;
        }

        public boolean isValid() {
            return valid;
        }

        public String getUsername() {
            return username;
        }
    }

    @Operation(summary = "Atualizar perfil do usuário", description = "Atualiza o nome e email do usuário autenticado")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usuário atualizado com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserResponse.class))),
        @ApiResponse(responseCode = "400", description = "Dados inválidos ou email já em uso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateUserRequest updateRequest,
                                          @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);

                // Validate token first
                if (!authService.validateToken(token)) {
                    return ResponseEntity.status(401)
                        .body(new ErrorResponse("Token inválido"));
                }

                // Get username from token and find user
                String email = authService.getUsernameFromToken(token);
                User currentUser = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

                // Update user
                User updatedUser = userService.updateUser(
                    currentUser.getId(),
                    updateRequest.getName(),
                    updateRequest.getEmail()
                );

                return ResponseEntity.ok(new UserResponse(
                    updatedUser.getId(),
                    updatedUser.getEmail(),
                    updatedUser.getName(),
                    updatedUser.getCreatedAt(),
                    updatedUser.getUpdatedAt()
                ));
            }

            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Header Authorization inválido"));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Erro ao atualizar usuário: " + e.getMessage()));
        }
    }

    private static class UserResponse {
        private String id;
        private String email;
        private String name;
        private java.time.LocalDateTime createdAt;
        private java.time.LocalDateTime updatedAt;

        public UserResponse(String id, String email, String name,
                           java.time.LocalDateTime createdAt, java.time.LocalDateTime updatedAt) {
            this.id = id;
            this.email = email;
            this.name = name;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }

        public String getId() {
            return id;
        }

        public String getEmail() {
            return email;
        }

        public String getName() {
            return name;
        }

        public java.time.LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public java.time.LocalDateTime getUpdatedAt() {
            return updatedAt;
        }
    }

    @Operation(summary = "Alterar senha do usuário", description = "Altera a senha do usuário autenticado")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Senha alterada com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = SuccessResponse.class))),
        @ApiResponse(responseCode = "400", description = "Dados inválidos ou senha atual incorreta",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest changePasswordRequest,
                                           @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);

                // Validate token first
                if (!authService.validateToken(token)) {
                    return ResponseEntity.status(401)
                        .body(new ErrorResponse("Token inválido"));
                }

                // Validate password confirmation
                if (!changePasswordRequest.getNewPassword().equals(changePasswordRequest.getConfirmPassword())) {
                    return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Confirmação de senha não confere"));
                }

                // Get username from token and find user
                String email = authService.getUsernameFromToken(token);
                User currentUser = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

                // Change password
                userService.changePassword(
                    currentUser.getId(),
                    changePasswordRequest.getCurrentPassword(),
                    changePasswordRequest.getNewPassword()
                );

                return ResponseEntity.ok(new SuccessResponse("Senha alterada com sucesso"));
            }

            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Header Authorization inválido"));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Erro ao alterar senha: " + e.getMessage()));
        }
    }

    private static class SuccessResponse {
        private String message;
        private long timestamp;

        public SuccessResponse(String message) {
            this.message = message;
            this.timestamp = System.currentTimeMillis();
        }

        public String getMessage() {
            return message;
        }

        public long getTimestamp() {
            return timestamp;
        }
    }
}