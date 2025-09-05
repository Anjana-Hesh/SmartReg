package lk.ijse.gdse72.backend.controller;

import jakarta.validation.Valid;
import lk.ijse.gdse72.backend.dto.WrittenExamDto;
import lk.ijse.gdse72.backend.dto.WrittenExamRequestDto;
import lk.ijse.gdse72.backend.dto.WrittenExamResultUpdateDTO;
import lk.ijse.gdse72.backend.service.WrittenExamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/written-exams")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class WrittenExamController {

    private final WrittenExamService writtenExamService;

    @PostMapping("/schedule")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WrittenExamDto> scheduleWrittenExam(@Valid @RequestBody WrittenExamRequestDto requestDto) {
        try {
            log.info("Scheduling written exam for application ID: {}", requestDto.getApplicationId());
            WrittenExamDto scheduledExam = writtenExamService.scheduleWrittenExam(requestDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(scheduledExam);
        } catch (RuntimeException e) {
            log.error("Error scheduling written exam: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error scheduling written exam", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{examId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DRIVER')")
    public ResponseEntity<WrittenExamDto> getWrittenExamById(@PathVariable Long examId) {
        try {
            log.info("Fetching written exam with ID: {}", examId);
            Optional<WrittenExamDto> exam = writtenExamService.getWrittenExamById(examId);
            return exam.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching written exam with ID: {}", examId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/application/{applicationId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DRIVER')")
    public ResponseEntity<WrittenExamDto> getWrittenExamByApplicationId(@PathVariable Long applicationId) {
        try {
            log.info("Fetching written exam for application ID: {}", applicationId);
            Optional<WrittenExamDto> exam = writtenExamService.getWrittenExamByApplicationId(applicationId);

            return exam.map(ResponseEntity::ok)
                    .orElseGet(() -> {
                        // Return a properly constructed default DTO with all required fields
                        WrittenExamDto defaultDto = WrittenExamDto.builder()
                                .id(null)
                                .writtenExamDate(null)
                                .writtenExamTime(null)
                                .writtenExamLocation("Not scheduled")
                                .note("No written exam scheduled for this application")
                                .writtenExamResult(null)
                                .applicationId(applicationId)
                                .driverName(null)
                                .licenseType(null)
                                .examLanguage(null)
                                .build();
                        return ResponseEntity.ok(defaultDto);
                    });
        } catch (Exception e) {
            log.error("Error fetching written exam for application ID: {}", applicationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<WrittenExamDto>> getAllWrittenExams() {
        try {
            log.info("Fetching all written exams");
            List<WrittenExamDto> exams = writtenExamService.getAllWrittenExams();
            return ResponseEntity.ok(exams);
        } catch (Exception e) {
            log.error("Error fetching all written exams", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{examId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WrittenExamDto> updateWrittenExam(
            @PathVariable Long examId,
            @Valid @RequestBody WrittenExamRequestDto requestDto) {
        try {
            log.info("Updating written exam with ID: {}", examId);
            WrittenExamDto updatedExam = writtenExamService.updateWrittenExam(examId, requestDto);
            return ResponseEntity.ok(updatedExam);
        } catch (RuntimeException e) {
            log.error("Error updating written exam with ID: {}: {}", examId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error updating written exam with ID: {}", examId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PatchMapping("/{examId}/result")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> updateExamResult(
            @PathVariable Long examId,
            @RequestParam String result,
            @RequestParam(required = false) String note) {
        try {
            writtenExamService.updateExamResult(examId, result, note);
            return ResponseEntity.ok("Exam result updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating exam result: " + e.getMessage());
        }
    }

    @DeleteMapping("/{examId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteWrittenExam(@PathVariable Long examId) {
        try {
            log.info("Deleting written exam with ID: {}", examId);
            writtenExamService.deleteWrittenExam(examId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting written exam with ID: {}: {}", examId, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error deleting written exam with ID: {}", examId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/result/{result}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<WrittenExamDto>> getWrittenExamsByResult(@PathVariable String result) {
        try {
            log.info("Fetching written exams with result: {}", result);

            if (!isValidResult(result)) {
                return ResponseEntity.badRequest().build();
            }

            List<WrittenExamDto> exams = writtenExamService.getWrittenExamsByResult(result);
            return ResponseEntity.ok(exams);
        } catch (Exception e) {
            log.error("Error fetching written exams with result: {}", result, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/exists/application/{applicationId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DRIVER')")
    public ResponseEntity<Boolean> existsByApplicationId(@PathVariable Long applicationId) {
        try {
            log.info("Checking if written exam exists for application ID: {}", applicationId);
            boolean exists = writtenExamService.existsByApplicationId(applicationId);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            log.error("Error checking exam existence for application ID: {}", applicationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PatchMapping("/{examId}/result-with-dates")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> updateExamResultWithDates(
            @PathVariable Long examId,
            @RequestBody WrittenExamResultUpdateDTO updateDTO) {
        try {
            writtenExamService.updateExamResultWithDates(
                    examId,
                    updateDTO.getResult(),
                    updateDTO.getNote(),
                    updateDTO.getTrialDate(),
                    updateDTO.getNextExamDate()
            );
            return ResponseEntity.ok("Exam result updated successfully with dates");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating exam result: " + e.getMessage());
        }
    }

    private boolean isValidResult(String result) {
        return result != null && (
                result.equalsIgnoreCase("PASS") ||
                        result.equalsIgnoreCase("FAIL") ||
                        result.equalsIgnoreCase("PENDING") ||
                        result.equalsIgnoreCase("ABSENT")
        );
    }
}