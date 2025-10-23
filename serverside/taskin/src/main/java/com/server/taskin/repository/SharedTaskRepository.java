package com.server.taskin.repository;

import com.server.taskin.model.SharedTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SharedTaskRepository extends JpaRepository<SharedTask, String> {

    List<SharedTask> findByTaskId(String taskId);

    List<SharedTask> findByTeamId(String teamId);

    @Query("SELECT st FROM SharedTask st WHERE st.taskId = :taskId AND st.teamId = :teamId")
    Optional<SharedTask> findByTaskIdAndTeamId(@Param("taskId") String taskId, @Param("teamId") String teamId);

    boolean existsByTaskIdAndTeamId(String taskId, String teamId);

    void deleteByTaskIdAndTeamId(String taskId, String teamId);

    @Query("SELECT st.taskId FROM SharedTask st WHERE st.teamId IN :teamIds")
    List<String> findTaskIdsByTeamIds(@Param("teamIds") List<String> teamIds);
}
