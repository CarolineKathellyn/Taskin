package com.taskin.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Configuração do Swagger/OpenAPI para documentação da API
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(apiInfo())
                .servers(apiServers())
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components()
                    .addSecuritySchemes("bearerAuth", 
                        new SecurityScheme()
                            .type(SecurityScheme.Type.HTTP)
                            .scheme("bearer")
                            .bearerFormat("JWT")
                            .description("JWT token de autenticação. Formato: Bearer {token}")
                    )
                );
    }

    private Info apiInfo() {
        return new Info()
                .title("Taskin API")
                .description("""
                    # API REST para Gerenciamento de Tarefas
                    
                    ## Visão Geral
                    A **Taskin API** é um sistema completo para gerenciamento de tarefas e produtividade, 
                    desenvolvido com Spring Boot e projetado para integração com aplicativos móveis React Native.
                    
                    ## Funcionalidades Principais
                    
                    ### 🔐 Autenticação
                    - Registro e login de usuários
                    - Autenticação JWT com refresh tokens
                    - Gerenciamento de perfis de usuário
                    
                    ### 📋 Gerenciamento de Tarefas
                    - CRUD completo de tarefas
                    - Sistema de prioridades (Baixa, Média, Alta, Urgente)
                    - Status de tarefas (Pendente, Em Progresso, Concluída, Cancelada)
                    - Definição de prazos e lembretes
                    - Busca e filtros avançados
                    
                    ### 🗂️ Organização
                    - Sistema de categorias personalizáveis
                    - Categorias padrão pré-definidas
                    - Cores e ícones customizáveis
                    - Estatísticas por categoria
                    
                    ### 📊 Dashboard e Analytics
                    - Estatísticas de produtividade
                    - Resumo diário de atividades
                    - Métricas de desempenho
                    - Relatórios por período
                    
                    ### 🔄 Sincronização
                    - Suporte à sincronização offline/online
                    - Controle de versões de dados
                    - Resolução de conflitos
                    
                    ## Como Usar
                    
                    ### 1. Autenticação
                    ```
                    POST /api/auth/register - Criar conta
                    POST /api/auth/login    - Fazer login
                    GET  /api/auth/me       - Obter dados do usuário
                    ```
                    
                    ### 2. Tarefas
                    ```
                    GET    /api/tasks       - Listar tarefas
                    POST   /api/tasks       - Criar tarefa
                    PUT    /api/tasks/{id}  - Atualizar tarefa
                    DELETE /api/tasks/{id}  - Excluir tarefa
                    ```
                    
                    ### 3. Categorias
                    ```
                    GET    /api/categories       - Listar categorias
                    POST   /api/categories       - Criar categoria
                    PUT    /api/categories/{id}  - Atualizar categoria
                    ```
                    
                    ### 4. Dashboard
                    ```
                    GET /api/dashboard/stats - Estatísticas gerais
                    GET /api/dashboard/today - Resumo do dia
                    ```
                    
                    ## Autenticação
                    A API utiliza **JWT (JSON Web Tokens)** para autenticação. Após o login, 
                    inclua o token no header `Authorization` de todas as requisições:
                    
                    ```
                    Authorization: Bearer {seu_token_aqui}
                    ```
                    
                    ## Códigos de Status
                    - `200` - Sucesso
                    - `201` - Criado com sucesso
                    - `400` - Dados inválidos
                    - `401` - Não autorizado
                    - `404` - Não encontrado
                    - `500` - Erro interno do servidor
                    
                    ## Versionamento
                    Esta é a versão **1.0.0** da API. Futuras versões manterão compatibilidade 
                    com esta versão sempre que possível.
                    """)
                .version("1.0.0")
                .contact(new Contact()
                    .name("Taskin Support")
                    .email("support@taskin.com")
                    .url("https://taskin.com/support"))
                .license(new License()
                    .name("MIT License")
                    .url("https://opensource.org/licenses/MIT"));
    }

    private List<Server> apiServers() {
        return List.of(
            new Server()
                .url("http://localhost:8080")
                .description("Servidor de Desenvolvimento"),
            new Server()
                .url("https://api.taskin.com")
                .description("Servidor de Produção")
        );
    }
}