package com.server.taskin.controller;

import com.server.taskin.dto.SyncRequest;
import com.server.taskin.dto.SyncResponse;
import com.server.taskin.model.User;
import com.server.taskin.service.SyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sync")
@Tag(name = "Sincronização", description = "Endpoints para sincronização de dados entre mobile e servidor")
@SecurityRequirement(name = "Bearer Authentication")
public class SyncController {

    @Autowired
    private SyncService syncService;

    @Operation(summary = "Upload do banco de dados", description = "Faz upload do banco SQLite local para o servidor")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Upload realizado com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = SyncResponse.class))),
        @ApiResponse(responseCode = "400", description = "Dados inválidos",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = SyncResponse.class))),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = SyncResponse.class)))
    })
    @PostMapping("/upload")
    public ResponseEntity<SyncResponse> uploadDatabase(
            @Valid @RequestBody SyncRequest syncRequest,
            Authentication authentication) {

        try {
            User user = (User) authentication.getPrincipal();
            SyncResponse response = syncService.uploadDatabase(user.getId(), syncRequest);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            SyncResponse errorResponse = SyncResponse.error("Erro interno do servidor: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @Operation(summary = "Download do banco de dados", description = "Faz download dos dados sincronizados do servidor")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Download realizado com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = SyncResponse.class))),
        @ApiResponse(responseCode = "400", description = "Erro na requisição",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = SyncResponse.class))),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = SyncResponse.class)))
    })
    @GetMapping("/download")
    public ResponseEntity<SyncResponse> downloadDatabase(Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            SyncResponse response = syncService.downloadDatabase(user.getId());

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            SyncResponse errorResponse = SyncResponse.error("Erro interno do servidor: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @Operation(summary = "Status da sincronização", description = "Obtém informações sobre o status da sincronização do usuário")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status obtido com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = SyncStatusResponse.class))),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/status")
    public ResponseEntity<?> getSyncStatus(Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();

            return ResponseEntity.ok(new SyncStatusResponse(
                user.getId(),
                user.getEmail(),
                user.getLastSyncAt(),
                user.getTaskDatabase() != null
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Erro ao obter status de sincronização: " + e.getMessage()));
        }
    }

    private static class SyncStatusResponse {
        private String userId;
        private String email;
        private java.time.LocalDateTime lastSyncAt;
        private boolean hasData;

        public SyncStatusResponse(String userId, String email, java.time.LocalDateTime lastSyncAt, boolean hasData) {
            this.userId = userId;
            this.email = email;
            this.lastSyncAt = lastSyncAt;
            this.hasData = hasData;
        }

        public String getUserId() {
            return userId;
        }

        public String getEmail() {
            return email;
        }

        public java.time.LocalDateTime getLastSyncAt() {
            return lastSyncAt;
        }

        public boolean isHasData() {
            return hasData;
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
}