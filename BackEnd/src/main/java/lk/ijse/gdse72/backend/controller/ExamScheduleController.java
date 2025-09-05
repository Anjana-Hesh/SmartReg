package lk.ijse.gdse72.backend.controller;

import lk.ijse.gdse72.backend.dto.ExamScheduleDTO;
import lk.ijse.gdse72.backend.service.ExamScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/exam-schedules")
@CrossOrigin
@RequiredArgsConstructor
@Slf4j
public class ExamScheduleController {

    private final ExamScheduleService examScheduleService;

    @PostMapping
    public ResponseEntity<?> createExamSchedule(@RequestBody ExamScheduleDTO examScheduleDTO) {
        try {
            log.info("Creating exam schedule for written exam ID: {}", examScheduleDTO.getWrittenExamId());

            // Validate input
            if (examScheduleDTO.getWrittenExamId() == null) {
                return ResponseEntity.badRequest().body("Written exam ID is required");
            }

            ExamScheduleDTO createdSchedule = examScheduleService.createExamSchedule(examScheduleDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdSchedule);
        } catch (RuntimeException e) {
            log.error("Error creating exam schedule: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error creating exam schedule", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error occurred");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExamSchedule(@PathVariable Long id, @RequestBody ExamScheduleDTO examScheduleDTO) {
        try {
            log.info("Updating exam schedule with ID: {}", id);

            examScheduleDTO.setId(id);
            ExamScheduleDTO updatedSchedule = examScheduleService.updateExamSchedule(examScheduleDTO);
            return ResponseEntity.ok(updatedSchedule);
        } catch (RuntimeException e) {
            log.error("Error updating exam schedule: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error updating exam schedule", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error occurred");
        }
    }

    @GetMapping("/written-exam/{writtenExamId}")
    public ResponseEntity<?> getExamScheduleByWrittenExamId(@PathVariable Long writtenExamId) {
        try {
            log.info("Fetching exam schedule for written exam ID: {}", writtenExamId);

            ExamScheduleDTO examSchedule = examScheduleService.getExamScheduleByWrittenExamId(writtenExamId);
            if (examSchedule != null) {
                return ResponseEntity.ok(examSchedule);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error fetching exam schedule for written exam ID: {}", writtenExamId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error occurred");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExamSchedule(@PathVariable Long id) {
        try {
            log.info("Deleting exam schedule with ID: {}", id);

            examScheduleService.deleteExamSchedule(id);
            return ResponseEntity.ok("Exam schedule deleted successfully");
        } catch (RuntimeException e) {
            log.error("Error deleting exam schedule: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error deleting exam schedule", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error occurred");
        }
    }
}