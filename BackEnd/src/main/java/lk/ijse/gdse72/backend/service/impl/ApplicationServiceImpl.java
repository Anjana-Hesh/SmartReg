package lk.ijse.gdse72.backend.service.impl;

import lk.ijse.gdse72.backend.dto.ApplicationDTO;
import lk.ijse.gdse72.backend.dto.VehicleClassDTO;
import lk.ijse.gdse72.backend.entity.Application;
import lk.ijse.gdse72.backend.entity.User;
import lk.ijse.gdse72.backend.repository.ApplicationRepository;
import lk.ijse.gdse72.backend.repository.UserRepository;
import lk.ijse.gdse72.backend.service.ApplicationService;
import lk.ijse.gdse72.backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
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
    private final FileStorageService fileStorageService;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${file.max-photo-size}")
    private String maxPhotoSize;

    @Value("${file.max-medical-size}")
    private String maxMedicalSize;

    @Override
    public ApplicationDTO submitApplication(ApplicationDTO applicationDTO,
                                            MultipartFile photo,
                                            MultipartFile medicalCertificate) throws IOException {

        // Validate driver exists
        User driver = userRepository.findById(applicationDTO.getDriverId())
                .orElseThrow(() -> new IllegalArgumentException("No driver found with ID: " + applicationDTO.getDriverId()));

        // Store files
        String photoPath = fileStorageService.storeFile(photo, "photo");
        String medicalPath = fileStorageService.storeFile(medicalCertificate, "medical");

        // Create and save application
        Application application = modelMapper.map(applicationDTO, Application.class);
        application.setPhotoPath(photoPath);
        application.setMedicalCertificatePath(medicalPath);
        application.setStatus("PENDING");
        application.setDriver(driver);

        Application savedApplication = applicationRepository.save(application);

        return modelMapper.map(savedApplication, ApplicationDTO.class);
    }

    @Override
    public ApplicationDTO updateApplicationStatus(Long applicationId, String status) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found with id: " + applicationId));

        application.setStatus(status);
        return convertToDTO(applicationRepository.save(application));
    }

    @Override
    public List<ApplicationDTO> getApplicationsByDriver(Long driverId) {
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
    public int getPendingApplicationCount(Long driverId) {
        return applicationRepository.countByDriverIdAndStatus(driverId, "PENDING");
    }

    private ApplicationDTO convertToDTO(Application application) {
        ApplicationDTO dto = new ApplicationDTO();
        dto.setId(application.getId());
        dto.setDriverId(application.getDriver().getId());
        dto.setLicenseType(application.getLicenseType());
        dto.setExamLanguage(application.getExamLanguage());
        dto.setVehicleClasses(
                application.getVehicleClasses());

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
}