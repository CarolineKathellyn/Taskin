package com.server.taskin.repository;

import com.server.taskin.model.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, String> {

    List<TeamMember> findByTeamId(String teamId);

    List<TeamMember> findByUserId(String userId);

    @Query("SELECT tm FROM TeamMember tm WHERE tm.team.id = :teamId AND tm.userId = :userId")
    Optional<TeamMember> findByTeamIdAndUserId(@Param("teamId") String teamId, @Param("userId") String userId);

    @Query("SELECT tm FROM TeamMember tm WHERE tm.team.id = :teamId AND tm.role = 'owner'")
    Optional<TeamMember> findOwnerByTeamId(@Param("teamId") String teamId);

    boolean existsByTeamIdAndUserId(String teamId, String userId);

    void deleteByTeamIdAndUserId(String teamId, String userId);
}
