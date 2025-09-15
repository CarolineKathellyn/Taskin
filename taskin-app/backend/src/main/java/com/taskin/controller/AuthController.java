package com.taskin.controller;

import com.taskin.dto.request.LoginRequest;
import com.taskin.dto.request.RegisterRequest;
import com.taskin.dto.response.AuthResponse;
import com.taskin.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller para operações de autenticação
 * 
 * Endpoints:
 * - POST /api/auth/register - Registrar novo usuário
 * - POST /api/auth/login - Fazer login
 * - POST /api/auth/refresh - Renovar token
 * - GET /api/auth/me - Obter dados do usuário atual
 * - POST /api/auth/logout - Fazer logout
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticação", description = "Operações de autenticação e autorização")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * Registrar novo usuário
     */
    @PostMapping("/register")
    @Operation(summary = "Registrar novo usuário", 
               description = "Cria uma nova conta de usuário no sistema")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Usuário criado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "409", description = "Email já cadastrado")
    })
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            // Validar se as senhas coincidem
            if (!registerRequest.isPasswordsMatch()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "As senhas não coincidem");
                return ResponseEntity.ok(health);
    }

    /**
     * Verificar se email já está em uso
     */
    @GetMapping("/check-email")
    @Operation(summary = "Verificar disponibilidade do email", 
               description = "Verifica se um email já está cadastrado no sistema")
    public ResponseEntity<Map<String, Boolean>> checkEmailAvailability(
            @RequestParam String email) {
        
        boolean isAvailable = authService.isEmailAvailable(email);
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("available", isAvailable);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Solicitar reset de senha
     */
    @PostMapping("/forgot-password")
    @Operation(summary = "Solicitar reset de senha", 
               description = "Envia email para reset de senha (funcionalidade futura)")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @RequestBody Map<String, String> request) {
        
        String email = request.get("email");
        
        // Por enquanto, apenas simular o envio
        Map<String, String> response = new HashMap<>();
        response.put("message", "Se o email existir, você receberá instruções para reset");
        
        return ResponseEntity.ok(response);
    }
} ResponseEntity.badRequest().body(error);
            }

            AuthResponse authResponse = authService.register(registerRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);

        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Fazer login
     */
    @PostMapping("/login")
    @Operation(summary = "Fazer login", 
               description = "Autentica usuário e retorna token JWT")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login realizado com sucesso"),
        @ApiResponse(responseCode = "401", description = "Credenciais inválidas"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse authResponse = authService.login(loginRequest);
            return ResponseEntity.ok(authResponse);

        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    /**
     * Renovar token JWT
     */
    @PostMapping("/refresh")
    @Operation(summary = "Renovar token", 
               description = "Renova o token JWT usando refresh token")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Token renovado com sucesso"),
        @ApiResponse(responseCode = "401", description = "Refresh token inválido")
    })
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        try {
            String refreshToken = request.get("refreshToken");
            if (refreshToken == null || refreshToken.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Refresh token é obrigatório");
                return ResponseEntity.badRequest().body(error);
            }

            AuthResponse authResponse = authService.refreshToken(refreshToken);
            return ResponseEntity.ok(authResponse);

        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    /**
     * Obter dados do usuário atual
     */
    @GetMapping("/me")
    @Operation(summary = "Obter perfil do usuário", 
               description = "Retorna os dados do usuário autenticado")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Dados do usuário retornados"),
        @ApiResponse(responseCode = "401", description = "Token inválido ou expirado")
    })
    public ResponseEntity<?> getCurrentUser() {
        try {
            AuthResponse.UserInfo userInfo = authService.getCurrentUser();
            return ResponseEntity.ok(userInfo);

        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    /**
     * Fazer logout
     */
    @PostMapping("/logout")
    @Operation(summary = "Fazer logout", 
               description = "Invalida o token atual do usuário")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Logout realizado com sucesso"),
        @ApiResponse(responseCode = "401", description = "Token inválido")
    })
    public ResponseEntity<?> logout() {
        try {
            authService.logout();
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Logout realizado com sucesso");
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    /**
     * Health check para autenticação
     */
    @GetMapping("/health")
    @Operation(summary = "Health check", 
               description = "Verifica se o serviço de autenticação está funcionando")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("service", "auth");
        health.put("status", "UP");
        health.put("timestamp", System.currentTimeMillis());
        health.put("version", "1.0.0");
        
        return