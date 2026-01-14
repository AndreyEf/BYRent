package com.rentflow.controller;

import com.google.cloud.storage.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.net.URL;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/storage")
@Slf4j
public class ObjectStorageController {

    @Value("${object.storage.bucket:}")
    private String bucketId;

    @Value("${object.storage.public.paths:public}")
    private String publicPaths;

    @Value("${object.storage.private.dir:.private}")
    private String privateDir;

    private Storage getStorage() {
        return StorageOptions.getDefaultInstance().getService();
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "directory", defaultValue = "public") String directory) {
        try {
            if (bucketId == null || bucketId.isEmpty()) {
                return ResponseEntity.status(503).body(Map.of("message", "Object storage not configured"));
            }

            Storage storage = getStorage();
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            String filename = UUID.randomUUID().toString() + extension;
            String path = directory + "/" + filename;

            BlobId blobId = BlobId.of(bucketId, path);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                .build();

            storage.create(blobInfo, file.getBytes());

            // Generate signed URL for public access
            URL signedUrl = storage.signUrl(blobInfo, 365, TimeUnit.DAYS);

            return ResponseEntity.ok(Map.of(
                "url", signedUrl.toString(),
                "path", path,
                "filename", originalFilename
            ));
        } catch (IOException e) {
            log.error("File upload error", e);
            return ResponseEntity.status(500).body(Map.of("message", "Ошибка загрузки файла"));
        }
    }

    @GetMapping("/presigned-url")
    public ResponseEntity<?> getPresignedUrl(
            @RequestParam("path") String path,
            @RequestParam(value = "action", defaultValue = "read") String action) {
        try {
            if (bucketId == null || bucketId.isEmpty()) {
                return ResponseEntity.status(503).body(Map.of("message", "Object storage not configured"));
            }

            Storage storage = getStorage();
            BlobInfo blobInfo = BlobInfo.newBuilder(BlobId.of(bucketId, path)).build();

            HttpMethod method = action.equals("write") ? HttpMethod.PUT : HttpMethod.GET;
            URL signedUrl = storage.signUrl(blobInfo, 1, TimeUnit.HOURS,
                Storage.SignUrlOption.httpMethod(method));

            return ResponseEntity.ok(Map.of("url", signedUrl.toString()));
        } catch (Exception e) {
            log.error("Presigned URL error", e);
            return ResponseEntity.status(500).body(Map.of("message", "Ошибка получения URL"));
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteFile(@RequestParam("path") String path) {
        try {
            if (bucketId == null || bucketId.isEmpty()) {
                return ResponseEntity.status(503).body(Map.of("message", "Object storage not configured"));
            }

            Storage storage = getStorage();
            boolean deleted = storage.delete(BlobId.of(bucketId, path));

            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Файл удалён"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("File delete error", e);
            return ResponseEntity.status(500).body(Map.of("message", "Ошибка удаления файла"));
        }
    }
}
