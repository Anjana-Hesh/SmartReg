package lk.ijse.gdse72.backend.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface FileStorageService {
    String storeFile(MultipartFile photo, String photo1) throws IOException;
    void deleteFile(String fileName) throws IOException;
}
