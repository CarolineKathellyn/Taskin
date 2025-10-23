package com.server.taskin.service;

import com.server.taskin.dto.AddMemberRequest;
import com.server.taskin.dto.TeamMemberResponse;
import com.server.taskin.dto.TeamRequest;
import com.server.taskin.dto.TeamResponse;
import com.server.taskin.exception.TaskinException;
import com.server.taskin.model.Team;
import com.server.taskin.model.TeamMember;
import com.server.taskin.model.User;
import com.server.taskin.repository.TeamMemberRepository;
import com.server.taskin.repository.TeamRepository;
import com.server.taskin.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class TeamService {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Create a new team
     */
    public TeamResponse createTeam(TeamRequest request, String createdBy) {
        Team team = new Team(request.getName(), request.getDescription(), createdBy);
        team = teamRepository.save(team);

        // Add creator as owner
        TeamMember ownerMember = new TeamMember(team, createdBy, "owner");
        teamMemberRepository.save(ownerMember);

        return new TeamResponse(team, 1, "owner");
    }

    /**
     * Get all teams for a user (as owner or member)
     */
    public List<TeamResponse> getUserTeams(String userId) {
        List<Team> teams = teamRepository.findAllTeamsForUser(userId);

        return teams.stream().map(team -> {
            int memberCount = teamMemberRepository.findByTeamId(team.getId()).size();
            String userRole = determineUserRole(team.getId(), userId);
            return new TeamResponse(team, memberCount, userRole);
        }).collect(Collectors.toList());
    }

    /**
     * Get team by ID
     */
    public TeamResponse getTeam(String teamId, String userId) {
        Team team = teamRepository.findById(teamId)
            .orElseThrow(() -> new TaskinException("TEAM_NOT_FOUND", "Equipe não encontrada"));

        // Check if user is a member
        if (!isMember(teamId, userId)) {
            throw new TaskinException("ACCESS_DENIED", "Acesso negado");
        }

        int memberCount = teamMemberRepository.findByTeamId(teamId).size();
        String userRole = determineUserRole(teamId, userId);

        return new TeamResponse(team, memberCount, userRole);
    }

    /**
     * Update team information
     */
    public TeamResponse updateTeam(String teamId, TeamRequest request, String userId) {
        Team team = teamRepository.findById(teamId)
            .orElseThrow(() -> new TaskinException("TEAM_NOT_FOUND", "Equipe não encontrada"));

        // Only owner can update team
        if (!isOwner(teamId, userId)) {
            throw new TaskinException("ACCESS_DENIED", "Apenas o proprietário pode atualizar a equipe");
        }

        team.setName(request.getName());
        team.setDescription(request.getDescription());
        team = teamRepository.save(team);

        int memberCount = teamMemberRepository.findByTeamId(teamId).size();
        return new TeamResponse(team, memberCount, "owner");
    }

    /**
     * Delete team
     */
    public void deleteTeam(String teamId, String userId) {
        Team team = teamRepository.findById(teamId)
            .orElseThrow(() -> new TaskinException("TEAM_NOT_FOUND", "Equipe não encontrada"));

        // Only owner can delete team
        if (!isOwner(teamId, userId)) {
            throw new TaskinException("ACCESS_DENIED", "Apenas o proprietário pode deletar a equipe");
        }

        teamRepository.delete(team);
    }

    /**
     * Add member to team
     */
    public TeamMemberResponse addMember(String teamId, AddMemberRequest request, String userId) {
        Team team = teamRepository.findById(teamId)
            .orElseThrow(() -> new TaskinException("TEAM_NOT_FOUND", "Equipe não encontrada"));

        // Only owner can add members
        if (!isOwner(teamId, userId)) {
            throw new TaskinException("ACCESS_DENIED", "Apenas o proprietário pode adicionar membros");
        }

        // Find user by email
        User userToAdd = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new TaskinException("USER_NOT_FOUND", "Usuário não encontrado"));

        // Check if already a member
        if (teamMemberRepository.existsByTeamIdAndUserId(teamId, userToAdd.getId())) {
            throw new TaskinException("ALREADY_MEMBER", "Usuário já é membro da equipe");
        }

        TeamMember newMember = new TeamMember(team, userToAdd.getId(), "member");
        newMember = teamMemberRepository.save(newMember);

        return new TeamMemberResponse(
            newMember.getId(),
            userToAdd.getId(),
            userToAdd.getEmail(),
            userToAdd.getName(),
            "member",
            newMember.getJoinedAt()
        );
    }

    /**
     * Remove member from team
     */
    public void removeMember(String teamId, String memberUserId, String requestingUserId) {
        // Check if team exists
        if (!teamRepository.existsById(teamId)) {
            throw new TaskinException("TEAM_NOT_FOUND", "Equipe não encontrada");
        }

        // Only owner can remove members
        if (!isOwner(teamId, requestingUserId)) {
            throw new TaskinException("ACCESS_DENIED", "Apenas o proprietário pode remover membros");
        }

        // Cannot remove owner
        if (isOwner(teamId, memberUserId)) {
            throw new TaskinException("CANNOT_REMOVE_OWNER", "Não é possível remover o proprietário da equipe");
        }

        teamMemberRepository.deleteByTeamIdAndUserId(teamId, memberUserId);
    }

    /**
     * Get team members
     */
    public List<TeamMemberResponse> getTeamMembers(String teamId, String userId) {
        // Check if user is a member
        if (!isMember(teamId, userId)) {
            throw new TaskinException("ACCESS_DENIED", "Acesso negado");
        }

        List<TeamMember> members = teamMemberRepository.findByTeamId(teamId);
        List<TeamMemberResponse> responses = new ArrayList<>();

        for (TeamMember member : members) {
            Optional<User> userOpt = userRepository.findById(member.getUserId());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                responses.add(new TeamMemberResponse(
                    member.getId(),
                    user.getId(),
                    user.getEmail(),
                    user.getName(),
                    member.getRole(),
                    member.getJoinedAt()
                ));
            }
        }

        return responses;
    }

    /**
     * Leave team
     */
    public void leaveTeam(String teamId, String userId) {
        // Check if user is a member
        if (!isMember(teamId, userId)) {
            throw new TaskinException("NOT_MEMBER", "Você não é membro desta equipe");
        }

        // Owner cannot leave (must delete team instead)
        if (isOwner(teamId, userId)) {
            throw new TaskinException("OWNER_CANNOT_LEAVE", "Proprietário não pode sair da equipe. Delete a equipe se desejar removê-la");
        }

        teamMemberRepository.deleteByTeamIdAndUserId(teamId, userId);
    }

    // Helper methods

    private boolean isMember(String teamId, String userId) {
        return teamMemberRepository.existsByTeamIdAndUserId(teamId, userId);
    }

    private boolean isOwner(String teamId, String userId) {
        Optional<TeamMember> ownerOpt = teamMemberRepository.findOwnerByTeamId(teamId);
        return ownerOpt.isPresent() && ownerOpt.get().getUserId().equals(userId);
    }

    private String determineUserRole(String teamId, String userId) {
        Optional<TeamMember> memberOpt = teamMemberRepository.findByTeamIdAndUserId(teamId, userId);
        return memberOpt.map(TeamMember::getRole).orElse("none");
    }

    public List<String> getUserTeamIds(String userId) {
        List<TeamMember> memberships = teamMemberRepository.findByUserId(userId);
        return memberships.stream()
            .map(tm -> tm.getTeam().getId())
            .collect(Collectors.toList());
    }
}
