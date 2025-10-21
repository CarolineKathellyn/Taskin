package com.server.taskin.repository;

import com.server.taskin.model.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, String> {

    List<Attachment> findByTaskId(String taskId);

    List<Attachment> findByUserId(String userId);

    void deleteByTaskId(String taskId);
}
