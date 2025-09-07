package lk.ijse.gdse72.backend.service.impl;

import lk.ijse.gdse72.backend.dto.TrialExamDTO;
import lk.ijse.gdse72.backend.entity.Application;
import lk.ijse.gdse72.backend.entity.TrialExam;
import lk.ijse.gdse72.backend.entity.WrittenExam;
import lk.ijse.gdse72.backend.repository.ApplicationRepository;
import lk.ijse.gdse72.backend.repository.TrialExamRepository;
import lk.ijse.gdse72.backend.repository.WrittenExamRepository;
import lk.ijse.gdse72.backend.service.TrialExamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class TrialExamServiceImpl implements TrialExamService {

    private final TrialExamRepository trialExamRepository;
    private final WrittenExamRepository writtenExamRepository;
    private final ApplicationRepository applicationRepository;

    @Override
    @Transactional
    public TrialExamDTO saveTrialExamResult(TrialExamDTO trialExamDTO) {
        log.info("Saving trial exam result for written exam ID: {}", trialExamDTO.getWrittenExamId());

        // Validate input
        if (trialExamDTO.getWrittenExamId() == null) {
            log.error("Written exam ID is null");
            throw new IllegalArgumentException("Written exam ID is required");
        }

        if (trialExamDTO.getTrialDate() == null) {
            log.error("Trial date is null");
            throw new IllegalArgumentException("Trial date is required");
        }

        if (trialExamDTO.getTrialResult() == null || trialExamDTO.getTrialResult().trim().isEmpty()) {
            log.error("Trial result is null or empty");
            throw new IllegalArgumentException("Trial result is required");
        }

        // Validate trial result values
        String normalizedResult = trialExamDTO.getTrialResult().toUpperCase().trim();
        if (!normalizedResult.equals("PASS") && !normalizedResult.equals("FAIL") && !normalizedResult.equals("ABSENT") && !normalizedResult.equals("PENDING")) {
            log.error("Invalid trial result: {}", trialExamDTO.getTrialResult());
            throw new IllegalArgumentException("Trial result must be PASS, FAIL, ABSENT or PENDING");
        }

        try {
            // Fetch written exam with application
            WrittenExam writtenExam = writtenExamRepository.findByIdWithApplication(trialExamDTO.getWrittenExamId())
                    .orElseThrow(() -> {
                        log.error("Written exam not found with ID: {}", trialExamDTO.getWrittenExamId());
                        return new IllegalArgumentException("Written exam not found with ID: " + trialExamDTO.getWrittenExamId());
                    });

            log.info("Found written exam: {}", writtenExam.getId());

            // Create trial exam entity
            TrialExam trialExam = TrialExam.builder()
                    .writtenExam(writtenExam)
                    .trialDate(trialExamDTO.getTrialDate())
                    .trialTime(trialExamDTO.getTrialTime() != null ? trialExamDTO.getTrialTime() : java.time.LocalTime.of(9, 0))
                    .trialLocation(trialExamDTO.getTrialLocation() != null ?
                            trialExamDTO.getTrialLocation() : "Colombo DMT")
                    .trialResult(normalizedResult)
                    .examinerNotes(trialExamDTO.getExaminerNotes())
                    .build();

            TrialExam savedTrialExam = trialExamRepository.save(trialExam);
            log.info("Trial exam result saved successfully with ID: {}", savedTrialExam.getId());

            // Update application status if trial is passed
            if ("PASS".equalsIgnoreCase(normalizedResult)) {
                try {
                    Application application = writtenExam.getApplication();
                    if (application != null) {
                        application.setStatus("COMPLETED");
                        applicationRepository.save(application); // Explicitly save the application
                        log.info("Application status updated to COMPLETED for application ID: {}", application.getId());
                    } else {
                        log.warn("No application found for written exam ID: {}", writtenExam.getId());
                    }
                } catch (Exception e) {
                    log.error("Error updating application status: {}", e.getMessage(), e);
                    // Don't fail the entire transaction for this, but log the error
                }
            }

            return convertToDTO(savedTrialExam);

        } catch (Exception e) {
            log.error("Error saving trial exam result", e);
            throw new RuntimeException("Failed to save trial exam result: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrialExamDTO> getTrialExamsByWrittenExamId(Long writtenExamId) {
        log.info("Fetching trial exams for written exam ID: {}", writtenExamId);

        if (writtenExamId == null) {
            throw new IllegalArgumentException("Written exam ID cannot be null");
        }

        List<TrialExam> trialExams = trialExamRepository.findByWrittenExamId(writtenExamId);
        log.info("Found {} trial exams for written exam ID: {}", trialExams.size(), writtenExamId);

        return trialExams.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TrialExamDTO getLatestTrialExam(Long writtenExamId) {
        log.info("Fetching latest trial exam for written exam ID: {}", writtenExamId);

        if (writtenExamId == null) {
            throw new IllegalArgumentException("Written exam ID cannot be null");
        }

        return trialExamRepository.findFirstByWrittenExamIdOrderByTrialDateDesc(writtenExamId)
                .map(this::convertToDTO)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPassedTrialExam(Long writtenExamId) {
        log.info("Checking if written exam ID {} has passed trial exam", writtenExamId);

        if (writtenExamId == null) {
            throw new IllegalArgumentException("Written exam ID cannot be null");
        }

        boolean hasPassed = trialExamRepository.existsByWrittenExamIdAndTrialResult(writtenExamId, "PASS");
        log.info("Written exam ID {} has passed trial exam: {}", writtenExamId, hasPassed);

        return hasPassed;
    }

    @Override
    @Transactional
    public TrialExamDTO updateTrialExamResult(Long id, TrialExamDTO trialExamDTO) {
        log.info("Updating trial exam with ID: {}", id);

        // Validate input
        if (id == null) {
            log.error("Trial exam ID is null");
            throw new IllegalArgumentException("Trial exam ID is required");
        }

        if (trialExamDTO.getTrialResult() == null || trialExamDTO.getTrialResult().trim().isEmpty()) {
            log.error("Trial result is null or empty");
            throw new IllegalArgumentException("Trial result is required");
        }

        // Validate trial result values
        String normalizedResult = trialExamDTO.getTrialResult().toUpperCase().trim();
        if (!normalizedResult.equals("PASS") && !normalizedResult.equals("FAIL") &&
                !normalizedResult.equals("ABSENT") && !normalizedResult.equals("PENDING")) {
            log.error("Invalid trial result: {}", trialExamDTO.getTrialResult());
            throw new IllegalArgumentException("Trial result must be PASS, FAIL, ABSENT or PENDING");
        }

        try {
            // Find existing trial exam
            TrialExam existingTrialExam = trialExamRepository.findById(id)
                    .orElseThrow(() -> {
                        log.error("Trial exam not found with ID: {}", id);
                        return new IllegalArgumentException("Trial exam not found with ID: " + id);
                    });

            log.info("Found existing trial exam: {}", existingTrialExam.getId());

            // Store old result for status update logic
            String oldResult = existingTrialExam.getTrialResult();

            // Update fields
            existingTrialExam.setTrialDate(trialExamDTO.getTrialDate() != null ?
                    trialExamDTO.getTrialDate() : existingTrialExam.getTrialDate());

            existingTrialExam.setTrialTime(trialExamDTO.getTrialTime() != null ?
                    trialExamDTO.getTrialTime() : existingTrialExam.getTrialTime());

            existingTrialExam.setTrialLocation(trialExamDTO.getTrialLocation() != null ?
                    trialExamDTO.getTrialLocation() : existingTrialExam.getTrialLocation());

            existingTrialExam.setTrialResult(normalizedResult);

            existingTrialExam.setExaminerNotes(trialExamDTO.getExaminerNotes());

            TrialExam updatedTrialExam = trialExamRepository.save(existingTrialExam);
            log.info("Trial exam updated successfully with ID: {}", updatedTrialExam.getId());

            // Handle application status update if result changed to/from PASS
            if (!normalizedResult.equals(oldResult)) {
                handleApplicationStatusUpdate(updatedTrialExam, normalizedResult, oldResult);
            }

            return convertToDTO(updatedTrialExam);

        } catch (Exception e) {
            log.error("Error updating trial exam result", e);
            throw new RuntimeException("Failed to update trial exam result: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public TrialExamDTO getTrialExamById(Long id) {
        log.info("Fetching trial exam by ID: {}", id);

        if (id == null) {
            throw new IllegalArgumentException("Trial exam ID cannot be null");
        }

        return trialExamRepository.findById(id)
                .map(this::convertToDTO)
                .orElseThrow(() -> {
                    log.error("Trial exam not found with ID: {}", id);
                    return new IllegalArgumentException("Trial exam not found with ID: " + id);
                });
    }

    @Override
    @Transactional
    public void deleteTrialExam(Long id) {
        log.info("Deleting trial exam with ID: {}", id);

        if (id == null) {
            throw new IllegalArgumentException("Trial exam ID cannot be null");
        }

        if (!trialExamRepository.existsById(id)) {
            log.error("Trial exam not found with ID: {}", id);
            throw new IllegalArgumentException("Trial exam not found with ID: " + id);
        }

        try {
            trialExamRepository.deleteById(id);
            log.info("Trial exam deleted successfully with ID: {}", id);
        } catch (Exception e) {
            log.error("Error deleting trial exam with ID: {}", id, e);
            throw new RuntimeException("Failed to delete trial exam: " + e.getMessage(), e);
        }
    }

    private void handleApplicationStatusUpdate(TrialExam trialExam, String newResult, String oldResult) {
        try {
            WrittenExam writtenExam = trialExam.getWrittenExam();
            if (writtenExam != null && writtenExam.getApplication() != null) {
                Application application = writtenExam.getApplication();

                // If result changed to PASS, update application status to COMPLETED
                if ("PASS".equalsIgnoreCase(newResult)) {
                    application.setStatus("COMPLETED");
                    applicationRepository.save(application);
                    log.info("Application status updated to COMPLETED for application ID: {}", application.getId());
                }
                // If result changed from PASS to something else, revert status to APPROVED
                else if ("PASS".equalsIgnoreCase(oldResult)) {
                    application.setStatus("APPROVED");
                    applicationRepository.save(application);
                    log.info("Application status reverted to APPROVED for application ID: {}", application.getId());
                }
            }
        } catch (Exception e) {
            log.error("Error handling application status update: {}", e.getMessage(), e);
            // Don't fail the main transaction for status update errors
        }
    }

    private TrialExamDTO convertToDTO(TrialExam trialExam) {
        if (trialExam == null) {
            return null;
        }

        try {
            return new TrialExamDTO(
                    trialExam.getId(),
                    trialExam.getWrittenExam() != null ? trialExam.getWrittenExam().getId() : null,
                    trialExam.getTrialDate(),
                    trialExam.getTrialTime(),
                    trialExam.getTrialLocation(),
                    trialExam.getTrialResult(),
                    trialExam.getExaminerNotes()
            );
        } catch (Exception e) {
            log.error("Error converting TrialExam to DTO", e);
            throw new RuntimeException("Error converting trial exam data", e);
        }
    }
}