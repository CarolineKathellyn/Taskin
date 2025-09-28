package com.server.taskin.controller;

import com.server.taskin.dto.AuthResponse;
import com.server.taskin.dto.LoginRequest;
import com.server.taskin.dto.RegisterRequest;
import com.server.taskin.service.AuthService;
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
}