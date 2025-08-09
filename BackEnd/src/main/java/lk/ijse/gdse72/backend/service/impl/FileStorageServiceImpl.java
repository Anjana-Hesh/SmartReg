package lk.ijse.gdse72.backend.service.impl;

import lk.ijse.gdse72.backend.service.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public String storeFile(MultipartFile file, String prefix) throws IOException {
        // Normalize and get absolute path
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();

        // Create directories if they don't exist
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Validate and clean filename
        if (file.getOriginalFilename() == null || file.getOriginalFilename().isEmpty()) {
            throw new IOException("File has no name");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";

        // Generate unique filename
        String filename = prefix + "_" + UUID.randomUUID() + fileExtension;

        // Save file
        Path targetLocation = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        return filename;
    }
}