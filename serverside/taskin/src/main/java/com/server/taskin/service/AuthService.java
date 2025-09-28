package com.server.taskin.service;

import com.server.taskin.dto.AuthResponse;
import com.server.taskin.dto.LoginRequest;
import com.server.taskin.dto.RegisterRequest;
import com.server.taskin.model.User;
import com.server.taskin.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private AuthenticationManager authenticationManager;

    public AuthResponse login(LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getEmail(),
                    loginRequest.getPassword()
                )
            );

            String jwt = tokenProvider.generateToken(authentication);
            User user = (User) authentication.getPrincipal();

            return new AuthResponse(
                jwt,
                user.getId(),
                user.getEmail(),
                user.getName(),
                tokenProvider.getExpirationTime()
            );

        } catch (AuthenticationException e) {
            throw new RuntimeException("Credenciais inválidas");
        }
    }

    public AuthResponse register(RegisterRequest registerRequest) {
        if (userService.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email já está em uso");
        }

        User user = userService.createUser(
            registerRequest.getEmail(),
            registerRequest.getPassword(),
            registerRequest.getName()
        );

        String jwt = tokenProvider.generateToken(user.getEmail());

        return new AuthResponse(
            jwt,
            user.getId(),
            user.getEmail(),
            user.getName(),
            tokenProvider.getExpirationTime()
        );
    }

    public boolean validateToken(String token) {
        return tokenProvider.validateToken(token);
    }

    public String getUsernameFromToken(String token) {
        return tokenProvider.getUsernameFromToken(token);
    }
}