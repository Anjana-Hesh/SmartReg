package lk.ijse.gdse72.backend.service.impl;

import lk.ijse.gdse72.backend.dto.ApplicationDTO;
import lk.ijse.gdse72.backend.dto.VehicleClassDTO;
import lk.ijse.gdse72.backend.entity.Application;
import lk.ijse.gdse72.backend.repository.ApplicationRepository;
import lk.ijse.gdse72.backend.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${file.max-photo-size}")
    private String maxPhotoSize;

    @Value("${file.max-medical-size}")
    private String maxMedicalSize;

    @Override
    public ApplicationDTO submitApplication(ApplicationDTO applicationDTO, MultipartFile photo, MultipartFile medicalCertificate) {
        try {
            // Validate files before saving
            validateFile(photo, "image", maxPhotoSize);
            validateFile(medicalCertificate, "application", maxMedicalSize);

            // Save files
            String photoPath = saveFile(photo);
            String medicalPath = saveFile(medicalCertificate);

            // Create and save application
            Application application = createApplicationEntity(applicationDTO, photoPath, medicalPath);
            Application savedApplication = applicationRepository.save(application);

            return convertToDTO(savedApplication);
        } catch (IOException e) {
            throw new RuntimeException("Failed to process application files", e);
        }
    }

    @Override
    public ApplicationDTO updateApplicationStatus(Long applicationId, String status) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found with id: " + applicationId));

        application.setStatus(status);
        return convertToDTO(applicationRepository.save(application));
    }

    @Override
    public List<ApplicationDTO> getApplicationsByDriver(String driverId) {
        return applicationRepository.findByDriverId(driverId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ApplicationDTO getApplicationById(Long applicationId) {
        return applicationRepository.findById(applicationId)
                .map(this::convertToDTO)
                .orElseThrow(() -> new RuntimeException("Application not found with id: " + applicationId));
    }

    @Override
    public int getPendingApplicationCount(String driverId) {
        return applicationRepository.countByDriverIdAndStatus(driverId, "PENDING");
    }

    private Application createApplicationEntity(ApplicationDTO dto, String photoPath, String medicalPath) {
        Application application = new Application();
        application.setDriverId(dto.getDriverId());
        application.setLicenseType(dto.getLicenseType());
        application.setExamLanguage(dto.getExamLanguage());
        application.setVehicleClasses(
                dto.getVehicleClasses().stream()
                        .map(VehicleClassDTO::getCode)
                        .collect(Collectors.toList())
        );
        application.setNicNumber(dto.getNicNumber());
        application.setBloodGroup(dto.getBloodGroup());
        application.setDateOfBirth(dto.getDateOfBirth());
        application.setPhoneNumber(dto.getPhoneNumber());
        application.setAddress(dto.getAddress());
        application.setPhotoPath(photoPath);
        application.setMedicalCertificatePath(medicalPath);
        application.setStatus("PENDING");
        return application;
    }

    private String saveFile(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename != null ?
                originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
        String filename = UUID.randomUUID() + fileExtension;

        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath);

        return filename;
    }

    private void validateFile(MultipartFile file, String expectedType, String maxSize) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith(expectedType)) {
            throw new IllegalArgumentException("Invalid file type. Expected " + expectedType);
        }

        // Validate file size (you'll need to parse maxSize string to bytes)
        // Implementation depends on how you want to handle size validation
    }

    private ApplicationDTO convertToDTO(Application application) {
        ApplicationDTO dto = new ApplicationDTO();
        dto.setId(application.getId());
        dto.setDriverId(application.getDriverId());
        dto.setLicenseType(application.getLicenseType());
        dto.setExamLanguage(application.getExamLanguage());
        dto.setVehicleClasses(
                application.getVehicleClasses().stream()
                        .map(code -> {
                            VehicleClassDTO vc = new VehicleClassDTO();
                            vc.setCode(code);
                            vc.setDescription(getVehicleClassDescription(code));
                            return vc;
                        })
                        .collect(Collectors.toList())
        );
        dto.setNicNumber(application.getNicNumber());
        dto.setBloodGroup(application.getBloodGroup());
        dto.setDateOfBirth(application.getDateOfBirth());
        dto.setPhoneNumber(application.getPhoneNumber());
        dto.setAddress(application.getAddress());
        dto.setPhotoPath(uploadDir + "/" + application.getPhotoPath());
        dto.setMedicalCertificatePath(uploadDir + "/" + application.getMedicalCertificatePath());
        dto.setStatus(application.getStatus());
        return dto;
    }

    private String getVehicleClassDescription(String code) {
        // Implement this method to return description based on code
        // Could be from a database lookup or a static map
        return "Description for " + code;
    }
}