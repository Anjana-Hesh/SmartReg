package lk.ijse.gdse72.backend.service;

import lk.ijse.gdse72.backend.dto.ApplicationDTO;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface ApplicationService {
    ApplicationDTO submitApplication(ApplicationDTO applicationDTO, MultipartFile photo, MultipartFile medicalCertificate) throws IOException;
    ApplicationDTO updateApplicationStatus(Long applicationId, String status);
    List<ApplicationDTO> getApplicationsByDriver(String driverId);
    ApplicationDTO getApplicationById(Long applicationId);
    int getPendingApplicationCount(String driverId);
}
