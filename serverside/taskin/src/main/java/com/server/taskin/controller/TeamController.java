package com.server.taskin.controller;

import com.server.taskin.dto.AddMemberRequest;
import com.server.taskin.dto.TeamMemberResponse;
import com.server.taskin.dto.TeamRequest;
import com.server.taskin.dto.TeamResponse;
import com.server.taskin.model.User;
import com.server.taskin.service.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/teams")
@Tag(name = "Equipes", description = "Endpoints para gerenciamento de equipes e compartilhamento")
@SecurityRequirement(name = "Bearer Authentication")
public class TeamController {

    @Autowired
    private TeamService teamService;

    @Operation(summary = "Criar equipe", description = "Cria uma nova equipe")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Equipe criada com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = TeamResponse.class))),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @PostMapping
    public ResponseEntity<TeamResponse> createTeam(
            @Valid @RequestBody TeamRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        TeamResponse response = teamService.createTeam(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Listar equipes do usuário", description = "Retorna todas as equipes que o usuário é membro")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de equipes retornada com sucesso"),
        @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @GetMapping
    public ResponseEntity<List<TeamResponse>> getUserTeams(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<TeamResponse> teams = teamService.getUserTeams(user.getId());
        return ResponseEntity.ok(teams);
    }

    @Operation(summary = "Obter equipe por ID", description = "Retorna detalhes de uma equipe específica")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Equipe encontrada",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = TeamResponse.class))),
        @ApiResponse(responseCode = "403", description = "Acesso negado"),
        @ApiResponse(responseCode = "404", description = "Equipe não encontrada")
    })
    @GetMapping("/{id}")
    public ResponseEntity<TeamResponse> getTeam(
            @PathVariable String id,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        TeamResponse response = teamService.getTeam(id, user.getId());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Atualizar equipe", description = "Atualiza informações da equipe (apenas proprietário)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Equipe atualizada com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado"),
        @ApiResponse(responseCode = "404", description = "Equipe não encontrada")
    })
    @PutMapping("/{id}")
    public ResponseEntity<TeamResponse> updateTeam(
            @PathVariable String id,
            @Valid @RequestBody TeamRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        TeamResponse response = teamService.updateTeam(id, request, user.getId());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Deletar equipe", description = "Deleta uma equipe (apenas proprietário)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Equipe deletada com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado"),
        @ApiResponse(responseCode = "404", description = "Equipe não encontrada")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeam(
            @PathVariable String id,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        teamService.deleteTeam(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Adicionar membro à equipe", description = "Adiciona um novo membro à equipe (apenas proprietário)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Membro adicionado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Usuário já é membro ou não encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado"),
        @ApiResponse(responseCode = "404", description = "Equipe não encontrada")
    })
    @PostMapping("/{id}/members")
    public ResponseEntity<TeamMemberResponse> addMember(
            @PathVariable String id,
            @Valid @RequestBody AddMemberRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        TeamMemberResponse response = teamService.addMember(id, request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Listar membros da equipe", description = "Retorna todos os membros de uma equipe")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de membros retornada com sucesso"),
        @ApiResponse(responseCode = "403", description = "Acesso negado"),
        @ApiResponse(responseCode = "404", description = "Equipe não encontrada")
    })
    @GetMapping("/{id}/members")
    public ResponseEntity<List<TeamMemberResponse>> getTeamMembers(
            @PathVariable String id,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        List<TeamMemberResponse> members = teamService.getTeamMembers(id, user.getId());
        return ResponseEntity.ok(members);
    }

    @Operation(summary = "Remover membro da equipe", description = "Remove um membro da equipe (apenas proprietário)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Membro removido com sucesso"),
        @ApiResponse(responseCode = "400", description = "Não é possível remover o proprietário"),
        @ApiResponse(responseCode = "403", description = "Acesso negado"),
        @ApiResponse(responseCode = "404", description = "Equipe não encontrada")
    })
    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable String id,
            @PathVariable String userId,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        teamService.removeMember(id, userId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Sair da equipe", description = "Remove o usuário atual da equipe")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Saiu da equipe com sucesso"),
        @ApiResponse(responseCode = "400", description = "Proprietário não pode sair da equipe"),
        @ApiResponse(responseCode = "404", description = "Equipe não encontrada")
    })
    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leaveTeam(
            @PathVariable String id,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        teamService.leaveTeam(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
