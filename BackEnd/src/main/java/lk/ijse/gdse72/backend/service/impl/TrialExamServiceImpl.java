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
        if (!normalizedResult.equals("PASS") && !normalizedResult.equals("FAIL") && !normalizedResult.equals("ABSENT")) {
            log.error("Invalid trial result: {}", trialExamDTO.getTrialResult());
            throw new IllegalArgumentException("Trial result must be PASS, FAIL, or ABSENT");
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