package com.server.taskin.controller;

import com.server.taskin.model.Attachment;
import com.server.taskin.model.User;
import com.server.taskin.repository.AttachmentRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/attachments")
@Tag(name = "Anexos", description = "Endpoints para gerenciamento de anexos de tarefas")
@SecurityRequirement(name = "Bearer Authentication")
public class AttachmentController {

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Value("${file.upload-dir:uploads/attachments}")
    private String uploadDir;

    @Operation(summary = "Upload de arquivo", description = "Faz upload de arquivo e associa à tarefa")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Upload realizado com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = Attachment.class))),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("taskId") String taskId,
            @RequestParam("fileType") String fileType,
            Authentication authentication) {

        try {
            User user = (User) authentication.getPrincipal();

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Arquivo está vazio"));
            }

            // Create directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir, taskId);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String uniqueFilename = UUID.randomUUID().toString() + extension;

            // Save file
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Create attachment record
            Attachment attachment = new Attachment(
                taskId,
                user.getId(),
                originalFilename != null ? originalFilename : uniqueFilename,
                filePath.toString(),
                fileType,
                file.getSize(),
                user.getEmail()
            );

            attachment = attachmentRepository.save(attachment);

            return ResponseEntity.ok(attachment);

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Erro ao fazer upload do arquivo: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Erro interno: " + e.getMessage()));
        }
    }

    @Operation(summary = "Adicionar link", description = "Adiciona um link como anexo à tarefa")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Link adicionado com sucesso",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = Attachment.class))),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @PostMapping("/link")
    public ResponseEntity<?> addLink(
            @RequestBody LinkRequest linkRequest,
            Authentication authentication) {

        try {
            User user = (User) authentication.getPrincipal();

            if (linkRequest.getUrl() == null || linkRequest.getUrl().isBlank()) {
                return ResponseEntity.badRequest().body(new ErrorResponse("URL é obrigatória"));
            }

            if (linkRequest.getTaskId() == null || linkRequest.getTaskId().isBlank()) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Task ID é obrigatório"));
            }

            // Create attachment record for link
            Attachment attachment = new Attachment(
                linkRequest.getTaskId(),
                user.getId(),
                linkRequest.getName() != null ? linkRequest.getName() : linkRequest.getUrl(),
                linkRequest.getUrl(),
                "link",
                0L,
                user.getEmail()
            );

            attachment = attachmentRepository.save(attachment);

            return ResponseEntity.ok(attachment);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Erro interno: " + e.getMessage()));
        }
    }

    @Operation(summary = "Listar anexos", description = "Lista todos os anexos de uma tarefa")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de anexos retornada com sucesso"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @GetMapping("/task/{taskId}")
    public ResponseEntity<?> getAttachmentsByTaskId(@PathVariable String taskId, Authentication authentication) {
        try {
            List<Attachment> attachments = attachmentRepository.findByTaskId(taskId);
            return ResponseEntity.ok(attachments);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Erro ao buscar anexos: " + e.getMessage()));
        }
    }

    @Operation(summary = "Download de arquivo", description = "Faz download de um arquivo anexo")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Download realizado com sucesso"),
        @ApiResponse(responseCode = "404", description = "Arquivo não encontrado"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadFile(@PathVariable String id, Authentication authentication) {
        try {
            Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anexo não encontrado"));

            // Don't download links
            if ("link".equals(attachment.getFileType())) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Links não podem ser baixados"));
            }

            Path filePath = Paths.get(attachment.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Erro ao acessar arquivo: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Erro interno: " + e.getMessage()));
        }
    }

    @Operation(summary = "Deletar anexo", description = "Remove um anexo e seu arquivo do servidor")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Anexo deletado com sucesso"),
        @ApiResponse(responseCode = "404", description = "Anexo não encontrado"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAttachment(@PathVariable String id, Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();

            Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anexo não encontrado"));

            // Verify ownership
            if (!attachment.getUserId().equals(user.getId())) {
                return ResponseEntity.status(403).body(new ErrorResponse("Sem permissão para deletar este anexo"));
            }

            // Delete file if not a link
            if (!"link".equals(attachment.getFileType())) {
                try {
                    Path filePath = Paths.get(attachment.getFilePath());
                    Files.deleteIfExists(filePath);
                } catch (IOException e) {
                    // Log error but continue with database deletion
                    System.err.println("Erro ao deletar arquivo físico: " + e.getMessage());
                }
            }

            // Delete from database
            attachmentRepository.delete(attachment);

            return ResponseEntity.ok(new SuccessResponse("Anexo deletado com sucesso"));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Erro ao deletar anexo: " + e.getMessage()));
        }
    }

    // Helper classes
    public static class LinkRequest {
        private String taskId;
        private String url;
        private String name;

        public String getTaskId() {
            return taskId;
        }

        public void setTaskId(String taskId) {
            this.taskId = taskId;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }

    public static class ErrorResponse {
        private String message;
        private long timestamp;

        public ErrorResponse(String message) {
            this.message = message;
            this.timestamp = System.currentTimeMillis();
        }

        public String getMessage() {
            return message;
        }

        public long getTimestamp() {
            return timestamp;
        }
    }

    public static class SuccessResponse {
        private String message;
        private long timestamp;

        public SuccessResponse(String message) {
            this.message = message;
            this.timestamp = System.currentTimeMillis();
        }

        public String getMessage() {
            return message;
        }

        public long getTimestamp() {
            return timestamp;
        }
    }
}
