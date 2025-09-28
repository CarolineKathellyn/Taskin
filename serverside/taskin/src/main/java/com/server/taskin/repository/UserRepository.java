package com.server.taskin.repository;

import com.server.taskin.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.enabled = true")
    Optional<User> findActiveUserByEmail(@Param("email") String email);

    @Query("SELECT u FROM User u WHERE u.lastSyncAt IS NULL OR u.lastSyncAt < :since")
    Iterable<User> findUsersNeedingSync(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :since")
    long countUsersCreatedSince(@Param("since") LocalDateTime since);

    @Query("SELECT u.taskDatabase FROM User u WHERE u.id = :userId")
    Optional<String> findTaskDatabaseByUserId(@Param("userId") String userId);
}