package com.server.taskin.repository;

import com.server.taskin.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, String> {

    List<Team> findByCreatedBy(String createdBy);

    @Query("SELECT t FROM Team t JOIN t.members tm WHERE tm.userId = :userId")
    List<Team> findTeamsByUserId(@Param("userId") String userId);

    @Query("SELECT t FROM Team t WHERE t.createdBy = :userId OR EXISTS (SELECT tm FROM TeamMember tm WHERE tm.team.id = t.id AND tm.userId = :userId)")
    List<Team> findAllTeamsForUser(@Param("userId") String userId);
}
