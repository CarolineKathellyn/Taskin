package com.taskin.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * Provedor de Tokens JWT para autenticação
 * 
 * Responsável por:
 * - Gerar tokens JWT
 * - Validar tokens
 * - Extrair informações do usuário
 * - Gerenciar expiração
 */
@Component
public class JwtTokenProvider {

    @Value("${taskin.jwt.secret:taskin-super-secret-key-2024}")
    private String jwtSecret;

    @Value("${taskin.jwt.expiration:86400000}") // 24 horas em ms
    private Long jwtExpirationInMs;

    @Value("${taskin.jwt.refresh-expiration:604800000}") // 7 dias em ms
    private Long refreshExpirationInMs;

    private Algorithm getAlgorithm() {
        return Algorithm.HMAC512(jwtSecret);
    }

    /**
     * Gera token JWT a partir da autenticação
     */
    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        return generateTokenFromUsername(userPrincipal.getUsername());
    }

    /**
     * Gera token JWT a partir do username
     */
    public String generateTokenFromUsername(String username) {
        Date expiryDate = new Date(System.currentTimeMillis() + jwtExpirationInMs);

        return JWT.create()
                .withSubject(username)
                .withIssuedAt(new Date())
                .withExpiresAt(expiryDate)
                .withIssuer("taskin-api")
                .withClaim("type", "access")
                .sign(getAlgorithm());
    }

    /**
     * Gera refresh token
     */
    public String generateRefreshToken(String username) {
        Date expiryDate = new Date(System.currentTimeMillis() + refreshExpirationInMs);

        return JWT.create()
                .withSubject(username)
                .withIssuedAt(new Date())
                .withExpiresAt(expiryDate)
                .withIssuer("taskin-api")
                .withClaim("type", "refresh")
                .sign(getAlgorithm());
    }

    /**
     * Extrai username do token JWT
     */
    public String getUsernameFromToken(String token) {
        try {
            JWTVerifier verifier = JWT.require(getAlgorithm())
                    .withIssuer("taskin-api")
                    .build();

            DecodedJWT jwt = verifier.verify(token);
            return jwt.getSubject();
        } catch (JWTVerificationException e) {
            throw new RuntimeException("Token JWT inválido", e);
        }
    }

    /**
     * Valida o token JWT
     */
    public boolean validateToken(String authToken) {
        try {
            JWTVerifier verifier = JWT.require(getAlgorithm())
                    .withIssuer("taskin-api")
                    .build();

            DecodedJWT jwt = verifier.verify(authToken);
            
            // Verificar se não expirou
            Date expiration = jwt.getExpiresAt();
            return expiration.after(new Date());

        } catch (JWTVerificationException e) {
            System.err.println("Token JWT inválido: " + e.getMessage());
            return false;
        }
    }

    /**
     * Obtém tempo de expiração do token
     */
    public Date getExpirationFromToken(String token) {
        try {
            JWTVerifier verifier = JWT.require(getAlgorithm())
                    .withIssuer("taskin-api")
                    .build();

            DecodedJWT jwt = verifier.verify(token);
            return jwt.getExpiresAt();
        } catch (JWTVerificationException e) {
            throw new RuntimeException("Não foi possível extrair data de expiração", e);
        }
    }

    /**
     * Verifica se o token é um refresh token
     */
    public boolean isRefreshToken(String token) {
        try {
            JWTVerifier verifier = JWT.require(getAlgorithm())
                    .withIssuer("taskin-api")
                    .build();

            DecodedJWT jwt = verifier.verify(token);
            String type = jwt.getClaim("type").asString();
            return "refresh".equals(type);
        } catch (JWTVerificationException e) {
            return false;
        }
    }

    /**
     * Calcula tempo restante do token em segundos
     */
    public long getTokenRemainingTime(String token) {
        Date expiration = getExpirationFromToken(token);
        long remainingTime = expiration.getTime() - System.currentTimeMillis();
        return Math.max(0, remainingTime / 1000); // Retorna em segundos
    }
}