package lk.ijse.gdse72.backend.service.impl;

import lk.ijse.gdse72.backend.dto.ApiResponse;
import lk.ijse.gdse72.backend.dto.LicenseDTO;
import lk.ijse.gdse72.backend.entity.License;
import lk.ijse.gdse72.backend.entity.TrialExam;
import lk.ijse.gdse72.backend.repository.LicenseRepository;
import lk.ijse.gdse72.backend.repository.TrialExamRepository;
import lk.ijse.gdse72.backend.service.LicenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LicenseServiceImpl implements LicenseService {

    private final LicenseRepository licenseRepository;
    private final TrialExamRepository trialExamRepository;

    @Override
    @Transactional
    public ApiResponse generateLicenseForPassedTrial(Long trialExamId) {
        try {
            // Check if license already exists
            if (licenseRepository.existsByTrialExamId(trialExamId)) {
                return new ApiResponse(
                        HttpStatus.CONFLICT.value(),
                        "CONFLICT",
                        "License already exists for this trial exam"
                );
            }

            // Get trial exam details
            Optional<TrialExam> trialExamOpt = trialExamRepository.findById(trialExamId);
            if (trialExamOpt.isEmpty()) {
                return new ApiResponse(
                        HttpStatus.NOT_FOUND.value(),
                        "NOT_FOUND",
                        "Trial exam not found"
                );
            }

            TrialExam trialExam = trialExamOpt.get();

            // Verify that trial exam result is PASS
            if (!"PASS".equalsIgnoreCase(trialExam.getTrialResult())) {
                return new ApiResponse(
                        HttpStatus.BAD_REQUEST.value(),
                        "BAD_REQUEST",
                        "License can only be generated for passed trial exams"
                );
            }

            // Generate license number
            String licenseNumber = generateLicenseNumber();

            // Set issue date (trial pass date or current date)
            LocalDate issueDate = trialExam.getTrialDate() != null ?
                    trialExam.getTrialDate() : LocalDate.now();

            // Calculate expiry date (8 years from issue date)
            LocalDate expireDate = issueDate.plusYears(8);

            // Create license entity
            License license = License.builder()
                    .licenseNumber(licenseNumber)
                    .issueDate(issueDate)
                    .expireDate(expireDate)
                    .trialExam(trialExam)
                    .build();

            // Save license
            License savedLicense = licenseRepository.save(license);

            // Convert to DTO
            LicenseDTO licenseDTO = convertToDTO(savedLicense);

            return new ApiResponse(
                    HttpStatus.CREATED.value(),
                    "SUCCESS",
                    licenseDTO
            );

        } catch (Exception e) {
            return new ApiResponse(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "ERROR",
                    "Failed to generate license: " + e.getMessage()
            );
        }
    }

    @Override
    public ApiResponse getLicenseById(Long licenseId) {
        try {
            Optional<License> licenseOpt = licenseRepository.findLicenseWithDriverDetails(licenseId);
            if (licenseOpt.isEmpty()) {
                return new ApiResponse(
                        HttpStatus.NOT_FOUND.value(),
                        "NOT_FOUND",
                        "License not found"
                );
            }

            LicenseDTO licenseDTO = convertToDTO(licenseOpt.get());
            return new ApiResponse(
                    HttpStatus.OK.value(),
                    "SUCCESS",
                    licenseDTO
            );

        } catch (Exception e) {
            return new ApiResponse(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "ERROR",
                    "Failed to retrieve license: " + e.getMessage()
            );
        }
    }

    @Override
    public ApiResponse getLicenseByNumber(String licenseNumber) {
        try {
            Optional<License> licenseOpt = licenseRepository.findByLicenseNumber(licenseNumber);
            if (licenseOpt.isEmpty()) {
                return new ApiResponse(
                        HttpStatus.NOT_FOUND.value(),
                        "NOT_FOUND",
                        "License not found with number: " + licenseNumber
                );
            }

            LicenseDTO licenseDTO = convertToDTO(licenseOpt.get());
            return new ApiResponse(
                    HttpStatus.OK.value(),
                    "SUCCESS",
                    licenseDTO
            );

        } catch (Exception e) {
            return new ApiResponse(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "ERROR",
                    "Failed to retrieve license: " + e.getMessage()
            );
        }
    }

    @Override
    public ApiResponse getLicensesByDriverNic(String nicNumber) {
        try {
            List<License> licenses = licenseRepository.findLicensesByDriverNic(nicNumber);
            List<LicenseDTO> licenseDTOs = licenses.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

            return new ApiResponse(
                    HttpStatus.OK.value(),
                    "SUCCESS",
                    licenseDTOs
            );

        } catch (Exception e) {
            return new ApiResponse(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "ERROR",
                    "Failed to retrieve licenses: " + e.getMessage()
            );
        }
    }

    @Override
    public ApiResponse getAllActiveLicenses() {
        try {
            List<License> activeLicenses = licenseRepository.findAllActiveLicenses();
            List<LicenseDTO> licenseDTOs = activeLicenses.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

            return new ApiResponse(
                    HttpStatus.OK.value(),
                    "SUCCESS",
                    licenseDTOs
            );

        } catch (Exception e) {
            return new ApiResponse(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "ERROR",
                    "Failed to retrieve active licenses: " + e.getMessage()
            );
        }
    }

    @Override
    public ApiResponse getAllExpiredLicenses() {
        try {
            List<License> expiredLicenses = licenseRepository.findAllExpiredLicenses();
            List<LicenseDTO> licenseDTOs = expiredLicenses.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

            return new ApiResponse(
                    HttpStatus.OK.value(),
                    "SUCCESS",
                    licenseDTOs
            );

        } catch (Exception e) {
            return new ApiResponse(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "ERROR",
                    "Failed to retrieve expired licenses: " + e.getMessage()
            );
        }
    }

    @Override
    public ApiResponse getAllLicenses() {
        try {
            List<License> allLicenses = licenseRepository.findAll();
            List<LicenseDTO> licenseDTOs = allLicenses.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

            return new ApiResponse(
                    HttpStatus.OK.value(),
                    "SUCCESS",
                    licenseDTOs
            );

        } catch (Exception e) {
            return new ApiResponse(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "ERROR",
                    "Failed to retrieve licenses: " + e.getMessage()
            );
        }
    }

    @Override
    @Transactional
    public ApiResponse updateLicense(Long licenseId, LicenseDTO licenseDTO) {
        try {
            Optional<License> licenseOpt = licenseRepository.findById(licenseId);
            if (licenseOpt.isEmpty()) {
                return new ApiResponse(
                        HttpStatus.NOT_FOUND.value(),
                        "NOT_FOUND",
                        "License not found"
                );
            }

            License license = licenseOpt.get();

            // Update fields if provided
            if (licenseDTO.getLicenseNumber() != null) {
                license.setLicenseNumber(licenseDTO.getLicenseNumber());
            }
            if (licenseDTO.getIssueDate() != null) {
                license.setIssueDate(licenseDTO.getIssueDate());
            }
            if (licenseDTO.getExpireDate() != null) {
                license.setExpireDate(licenseDTO.getExpireDate());
            }

            License updatedLicense = licenseRepository.save(license);
            LicenseDTO updatedDTO = convertToDTO(updatedLicense);

            return new ApiResponse(
                    HttpStatus.OK.value(),
                    "SUCCESS",
                    updatedDTO
            );

        } catch (Exception e) {
            return new ApiResponse(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "ERROR",
                    "Failed to update license: " + e.getMessage()
            );
        }
    }

    @Override
    @Transactional
    public ApiResponse deleteLicense(Long licenseId) {
        try {
            Optional<License> licenseOpt = licenseRepository.findById(licenseId);
            if (licenseOpt.isEmpty()) {
                return new ApiResponse(
                        HttpStatus.NOT_FOUND.value(),
                        "NOT_FOUND",
                        "License not found"
                );
            }

            // Soft delete by setting expiry date to current date
            License license = licenseOpt.get();
            license.setExpireDate(LocalDate.now());
            licenseRepository.save(license);

            return new ApiResponse(
                    HttpStatus.OK.value(),
                    "SUCCESS",
                    "License deactivated successfully"
            );

        } catch (Exception e) {
            return new ApiResponse(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "ERROR",
                    "Failed to delete license: " + e.getMessage()
            );
        }
    }

    @Override
    public boolean licenseExistsForTrial(Long trialExamId) {
        return licenseRepository.existsByTrialExamId(trialExamId);
    }

    /**
     * Generate unique license number
     * Format: DL-YYYY-NNNNNN (DL = Driving License, YYYY = Year, NNNNNN = Sequential number)
     */
    private String generateLicenseNumber() {
        int currentYear = LocalDate.now().getYear();
        long count = licenseRepository.count() + 1;
        return String.format("DL-%d-%06d", currentYear, count);
    }

    /**
     * Convert License entity to DTO
     */
    private LicenseDTO convertToDTO(License license) {
        LicenseDTO dto = new LicenseDTO();
        dto.setId(license.getId());
        dto.setLicenseNumber(license.getLicenseNumber());
        dto.setIssueDate(license.getIssueDate());
        dto.setExpireDate(license.getExpireDate());
        dto.setTrialExamId(license.getTrialExam().getId());

        // Add driver information if available
        try {
            if (license.getTrialExam() != null &&
                    license.getTrialExam().getWrittenExam() != null &&
                    license.getTrialExam().getWrittenExam().getApplication() != null) {

                var application = license.getTrialExam().getWrittenExam().getApplication();
                dto.setDriverName(application.getDriver().getFullName());
                dto.setNicNumber(application.getNicNumber());
                dto.setLicenseType(application.getLicenseType());
                dto.setVehicleClasses(application.getVehicleClasses() != null ?
                        String.join(", ", application.getVehicleClasses()) : null);
            }
        } catch (Exception e) {
            // If there's an issue accessing nested data, continue without it
        }

        return dto;
    }

    @Override
    public ApiResponse getLicenseByTrialExamId(Long trialExamId) {
        try {
            Optional<License> licenseOpt = licenseRepository.findByTrialExamId(trialExamId);
            if (licenseOpt.isEmpty()) {
                return new ApiResponse(
                        HttpStatus.NOT_FOUND.value(),
                        "NOT_FOUND",
                        "License not found for trial exam ID: " + trialExamId
                );
            }

            LicenseDTO licenseDTO = convertToDTO(licenseOpt.get());
            return new ApiResponse(
                    HttpStatus.OK.value(),
                    "SUCCESS",
                    licenseDTO
            );

        } catch (Exception e) {
            return new ApiResponse(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "ERROR",
                    "Failed to retrieve license: " + e.getMessage()
            );
        }
    }
}