package lk.ijse.gdse72.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ijse.gdse72.backend.dto.ApplicationDTO;
import lk.ijse.gdse72.backend.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("api/v1/applications")
@RequiredArgsConstructor
@CrossOrigin
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping(path = "/create-application", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitApplication(
            @RequestPart("application") String applicationJson,
            @RequestPart("photo") MultipartFile photo,
            @RequestPart("medical") MultipartFile medicalCertificate) {

        try {
            // Convert JSON string to DTO
            ObjectMapper objectMapper = new ObjectMapper();
            ApplicationDTO applicationDTO = objectMapper.readValue(applicationJson, ApplicationDTO.class);

            if (photo.isEmpty() || medicalCertificate.isEmpty()) {
                return ResponseEntity.badRequest().body("Photo and medical certificate are required.");
            }

            ApplicationDTO savedApplication = applicationService.submitApplication(
                    applicationDTO, photo, medicalCertificate);

            return ResponseEntity.ok(savedApplication);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Failed to submit application: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/status")
    public ResponseEntity<ApplicationDTO> updateApplicationStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        ApplicationDTO updatedApplication = applicationService.updateApplicationStatus(id, status);
        return ResponseEntity.ok(updatedApplication);
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<ApplicationDTO>> getApplicationsByDriver(
            @PathVariable String driverId) {

        List<ApplicationDTO> applications = applicationService.getApplicationsByDriver(driverId);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationDTO> getApplicationById(@PathVariable Long id) {
        ApplicationDTO application = applicationService.getApplicationById(id);
        return ResponseEntity.ok(application);
    }

    @GetMapping("/driver/{driverId}/pending-count")
    public ResponseEntity<Integer> getPendingApplicationCount(
            @PathVariable String driverId) {

        int count = applicationService.getPendingApplicationCount(driverId);
        return ResponseEntity.ok(count);
    }
}
