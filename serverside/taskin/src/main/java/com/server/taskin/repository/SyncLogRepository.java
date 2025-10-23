package com.server.taskin.repository;

import com.server.taskin.model.SyncLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SyncLogRepository extends JpaRepository<SyncLog, String> {

    List<SyncLog> findByUserIdAndTimestampAfter(String userId, LocalDateTime timestamp);

    List<SyncLog> findByTeamIdAndTimestampAfter(String teamId, LocalDateTime timestamp);

    @Query("SELECT sl FROM SyncLog sl WHERE (sl.userId = :userId OR sl.teamId IN :teamIds) AND sl.timestamp > :timestamp ORDER BY sl.timestamp ASC")
    List<SyncLog> findChangesSinceTimestamp(
        @Param("userId") String userId,
        @Param("teamIds") List<String> teamIds,
        @Param("timestamp") LocalDateTime timestamp
    );

    @Query("SELECT sl FROM SyncLog sl WHERE sl.entityType = :entityType AND sl.entityId = :entityId ORDER BY sl.timestamp DESC")
    List<SyncLog> findByEntityTypeAndEntityId(@Param("entityType") String entityType, @Param("entityId") String entityId);

    @Query("SELECT sl FROM SyncLog sl WHERE sl.entityType = :entityType AND sl.entityId = :entityId AND sl.timestamp > :timestamp ORDER BY sl.timestamp DESC")
    List<SyncLog> findRecentChangesByEntity(
        @Param("entityType") String entityType,
        @Param("entityId") String entityId,
        @Param("timestamp") LocalDateTime timestamp
    );
}
