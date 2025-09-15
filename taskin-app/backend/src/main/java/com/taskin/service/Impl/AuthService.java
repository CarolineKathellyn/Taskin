package com.taskin.service;

import com.taskin.dto.request.LoginRequest;
import com.taskin.dto.request.RegisterRequest;
import com.taskin.dto.response.AuthResponse;

/**
 * Interface do serviço de autenticação
 */
public interface AuthService {
    
    /**
     * Registra um novo usuário no sistema
     */
    AuthResponse register(RegisterRequest registerRequest);
    
    /**
     * Realiza login do usuário
     */
    AuthResponse login(LoginRequest loginRequest);
    
    /**
     * Renova o token usando refresh token
     */
    AuthResponse refreshToken(String refreshToken);
    
    /**
     * Obtém dados do usuário atual
     */
    AuthResponse.UserInfo getCurrentUser();
    
    /**
     * Realiza logout do usuário
     */
    void logout();
    
    /**
     * Verifica se email está disponível
     */
    boolean isEmailAvailable(String email);
}

// ==================== IMPLEMENTAÇÃO ====================
// backend/src/main/java/com/taskin/service/impl/AuthServiceImpl.java
package com.taskin.service.Impl;

import com.taskin.dto.request.LoginRequest;
import com.taskin.dto.request.RegisterRequest;
import com.taskin.dto.response.AuthResponse;
import com.taskin.model.Category;
import com.taskin.model.User;
import com.taskin.repository.CategoryRepository;
import com.taskin.repository.UserRepository;
import com.taskin.security.JwtTokenProvider;
import com.taskin.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Implementação do serviço de autenticação
 */
@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Override
    public AuthResponse register(RegisterRequest registerRequest) {
        // Verificar se email já existe
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email já está cadastrado no sistema");
        }

        // Criar novo usuário
        User user = new User();
        user.setName(registerRequest.getName());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setPhone(registerRequest.getPhone());
        user.setTimezone(registerRequest.getTimezone());
        user.setLanguage(registerRequest.getLanguage());
        user.setEmailVerified(false);
        user.setIsActive(true);

        // Salvar usuário
        user = userRepository.save(user);

        // Criar categorias padrão para o usuário
        createDefaultCategories(user);

        // Gerar tokens
        String token = tokenProvider.generateTokenFromUsername(user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());
        Long expiresIn = 86400L; // 24 horas em segundos

        return new AuthResponse(token, refreshToken, expiresIn, user);
    }

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        try {
            // Autenticar usuário
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getEmail(),
                    loginRequest.getPassword()
                )
            );

            // Definir contexto de segurança
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Buscar usuário
            User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

            // Verificar se usuário está ativo
            if (!user.getIsActive()) {
                throw new RuntimeException("Conta desativada. Entre em contato com o suporte");
            }

            // Atualizar último login
            user.setLastLogin(LocalDateTime.now());
            user = userRepository.save(user);

            // Gerar tokens
            String token = tokenProvider.generateToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());
            Long expiresIn = 86400L; // 24 horas em segundos

            return new AuthResponse(token, refreshToken, expiresIn, user);

        } catch (Exception e) {
            throw new RuntimeException("Email ou senha incorretos");
        }
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        try {
            // Validar refresh token
            if (!tokenProvider.validateToken(refreshToken)) {
                throw new RuntimeException("Refresh token inválido ou expirado");
            }

            // Verificar se é realmente um refresh token
            if (!tokenProvider.isRefreshToken(refreshToken)) {
                throw new RuntimeException("Token fornecido não é um refresh token");
            }

            // Extrair username
            String username = tokenProvider.getUsernameFromToken(refreshToken);

            // Buscar usuário
            User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

            // Verificar se usuário está ativo
            if (!user.getIsActive()) {
                throw new RuntimeException("Conta desativada");
            }

            // Gerar novos tokens
            String newToken = tokenProvider.generateTokenFromUsername(username);
            String newRefreshToken = tokenProvider.generateRefreshToken(username);
            Long expiresIn = 86400L; // 24 horas em segundos

            return new AuthResponse(newToken, newRefreshToken, expiresIn, user);

        } catch (Exception e) {
            throw new RuntimeException("Não foi possível renovar o token: " + e.getMessage());
        }
    }

    @Override
    public AuthResponse.UserInfo getCurrentUser() {
        // Obter usuário autenticado do contexto de segurança
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Usuário não autenticado");
        }

        String username = authentication.getName();
        User user = userRepository.findByEmail(username)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        return new AuthResponse.UserInfo(user);
    }

    @Override
    public void logout() {
        // Limpar contexto de segurança
        SecurityContextHolder.clearContext();
        
        // Nota: Em uma implementação mais robusta, poderíamos:
        // 1. Adicionar token a uma blacklist
        // 2. Registrar evento de logout
        // 3. Invalidar refresh tokens
    }

    @Override
    public boolean isEmailAvailable(String email) {
        return !userRepository.existsByEmail(email);
    }

    /**
     * Cria categorias padrão para um novo usuário
     */
    private void createDefaultCategories(User user) {
        List<Category> defaultCategories = Category.DefaultCategories.createDefaultCategories(user);
        categoryRepository.saveAll(defaultCategories);
    }

    /**
     * Obtém o usuário atual do contexto de segurança
     */
    public User getCurrentUserEntity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Usuário não autenticado");
        }

        String username = authentication.getName();
        return userRepository.findByEmail(username)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }
}