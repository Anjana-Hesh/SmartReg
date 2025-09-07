package lk.ijse.gdse72.backend.controller;

import jakarta.validation.Valid;
import lk.ijse.gdse72.backend.dto.TrialExamDTO;
import lk.ijse.gdse72.backend.service.TrialExamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/trial-exams")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class TrialExamController {

    private final TrialExamService trialExamService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> saveTrialExamResult(@Valid @RequestBody TrialExamDTO trialExamDTO) {
        try {
            log.info("Saving trial exam result for written exam ID: {}", trialExamDTO.getWrittenExamId());

            // Validate input
            if (trialExamDTO.getWrittenExamId() == null) {
                log.warn("Written exam ID is null in request");
                return ResponseEntity.badRequest().body("Written exam ID is required");
            }

            if (trialExamDTO.getTrialDate() == null) {
                log.warn("Trial date is null in request");
                return ResponseEntity.badRequest().body("Trial date is required");
            }

            if (trialExamDTO.getTrialResult() == null || trialExamDTO.getTrialResult().isEmpty()) {
                log.warn("Trial result is null or empty in request");
                return ResponseEntity.badRequest().body("Trial result is required");
            }

            TrialExamDTO savedTrialExam = trialExamService.saveTrialExamResult(trialExamDTO);
            log.info("Trial exam result saved successfully with ID: {}", savedTrialExam.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(savedTrialExam);

        } catch (RuntimeException e) {
            log.error("Error saving trial exam result: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error saving trial exam result", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error occurred: " + e.getMessage());
        }
    }

    @GetMapping("/written-exam/{writtenExamId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DRIVER')")
    public ResponseEntity<List<TrialExamDTO>> getTrialExamsByWrittenExam(@PathVariable Long writtenExamId) {
        try {
            log.info("Fetching trial exams for written exam ID: {}", writtenExamId);

            List<TrialExamDTO> trialExams = trialExamService.getTrialExamsByWrittenExamId(writtenExamId);
            return ResponseEntity.ok(trialExams);
        } catch (Exception e) {
            log.error("Error fetching trial exams for written exam ID: {}", writtenExamId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/written-exam/{writtenExamId}/latest")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DRIVER')")
    public ResponseEntity<TrialExamDTO> getLatestTrialExam(@PathVariable Long writtenExamId) {
        try {
            log.info("Fetching latest trial exam for written exam ID: {}", writtenExamId);

            TrialExamDTO trialExam = trialExamService.getLatestTrialExam(writtenExamId);
            if (trialExam != null) {
                return ResponseEntity.ok(trialExam);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error fetching latest trial exam for written exam ID: {}", writtenExamId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/written-exam/{writtenExamId}/has-passed")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DRIVER')")
    public ResponseEntity<Boolean> hasPassedTrialExam(@PathVariable Long writtenExamId) {
        try {
            log.info("Checking if written exam ID {} has passed trial exam", writtenExamId);

            boolean hasPassed = trialExamService.hasPassedTrialExam(writtenExamId);
            return ResponseEntity.ok(hasPassed);
        } catch (Exception e) {
            log.error("Error checking trial exam pass status for written exam ID: {}", writtenExamId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}