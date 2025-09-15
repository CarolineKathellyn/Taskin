package com.taskin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class TaskinApplication {
    public static void main(String[] args) {
        SpringApplication.run(TaskinApplication.class, args);
        
        System.out.println("""
            
            🚀 ===================================== 🚀
            📱 TASKIN API - SISTEMA INICIADO
            🚀 ===================================== 🚀
            
            📋 Swagger UI: http://localhost:8080/swagger-ui.html
            📊 H2 Console: http://localhost:8080/h2-console
            📈 Actuator: http://localhost:8080/actuator
            
            🎯 Sprint 1 - Funcionalidades:
            ✅ Configuração Inicial
            ✅ Estrutura Backend/Frontend
            ✅ Banco H2 Configurado
            ✅ Documentação Swagger
            
            """);
    }
}
