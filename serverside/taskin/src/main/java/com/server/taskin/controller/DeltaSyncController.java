package com.server.taskin.controller;

import com.server.taskin.dto.DeltaSyncRequest;
import com.server.taskin.dto.DeltaSyncResponse;
import com.server.taskin.model.User;
import com.server.taskin.service.DeltaSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/sync/delta")
@Tag(name = "Sincronização Delta", description = "Endpoints para sincronização incremental de dados")
@SecurityRequirement(name = "Bearer Authentication")
public class DeltaSyncController {

    @Autowired
    private DeltaSyncService deltaSyncService;

    @Operation(summary = "Sincronização delta", description = "Sincroniza mudanças incrementais entre cliente e servidor")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Sincronização realizada com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = DeltaSyncResponse.class))),
        @ApiResponse(responseCode = "400", description = "Dados inválidos",
                content = @Content(mediaType = "application/json")),
        @ApiResponse(responseCode = "401", description = "Não autorizado"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @PostMapping
    public ResponseEntity<DeltaSyncResponse> deltaSync(
            @Valid @RequestBody DeltaSyncRequest request,
            Authentication authentication) {

        try {
            User user = (User) authentication.getPrincipal();
            DeltaSyncResponse response = deltaSyncService.processDeltaSync(request, user.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            DeltaSyncResponse errorResponse = new DeltaSyncResponse(
                null,
                null,
                LocalDateTime.now(),
                false,
                "Erro ao processar sincronização: " + e.getMessage()
            );
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @Operation(summary = "Obter mudanças desde", description = "Obtém todas as mudanças desde um timestamp específico")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Mudanças retornadas com sucesso"),
        @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @GetMapping("/changes")
    public ResponseEntity<List<DeltaSyncResponse.SyncChange>> getChangesSince(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        LocalDateTime sinceTime = since != null ? since : LocalDateTime.now().minusDays(7);
        List<DeltaSyncResponse.SyncChange> changes = deltaSyncService.getChangesSince(user.getId(), sinceTime);
        return ResponseEntity.ok(changes);
    }
}
