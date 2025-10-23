package com.server.taskin.repository;

import com.server.taskin.model.SharedProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SharedProjectRepository extends JpaRepository<SharedProject, String> {

    List<SharedProject> findByProjectId(String projectId);

    List<SharedProject> findByTeamId(String teamId);

    @Query("SELECT sp FROM SharedProject sp WHERE sp.projectId = :projectId AND sp.teamId = :teamId")
    Optional<SharedProject> findByProjectIdAndTeamId(@Param("projectId") String projectId, @Param("teamId") String teamId);

    boolean existsByProjectIdAndTeamId(String projectId, String teamId);

    void deleteByProjectIdAndTeamId(String projectId, String teamId);

    @Query("SELECT sp.projectId FROM SharedProject sp WHERE sp.teamId IN :teamIds")
    List<String> findProjectIdsByTeamIds(@Param("teamIds") List<String> teamIds);
}
