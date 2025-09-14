package lk.ijse.gdse72.backend.service.impl;

import lk.ijse.gdse72.backend.dto.TrialExamDTO;
import lk.ijse.gdse72.backend.entity.Application;
import lk.ijse.gdse72.backend.entity.TrialExam;
import lk.ijse.gdse72.backend.entity.WrittenExam;
import lk.ijse.gdse72.backend.repository.ApplicationRepository;
import lk.ijse.gdse72.backend.repository.TrialExamRepository;
import lk.ijse.gdse72.backend.repository.WrittenExamRepository;
import lk.ijse.gdse72.backend.service.EmailService;
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
    private final EmailService emailService;
    private final TwilioSmsServiceImpl smsService;

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

            // ===== Send Result Email =====
            try {
                String driverName = updatedTrialExam.getWrittenExam().getApplication().getDriver().getFullName();
                String driverEmail = updatedTrialExam.getWrittenExam().getApplication().getDriver().getEmail();
                String subject;
                String body;
                String driverPhone = String.valueOf(updatedTrialExam.getWrittenExam().getApplication().getDriver().getPhoneNumber());

                // Conditional logic for different email templates
                if ("PASS".equals(normalizedResult)) {
                    subject = "Congratulations! Your Trial Exam Result is a Pass So You COMPLETE your License";
                    body = "<!DOCTYPE html>" +
                            "<html lang=\"en\">" +
                            "<head>" +
                            "    <meta charset=\"UTF-8\">" +
                            "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                            "    <title>Exam Result: Pass</title>" +
                            "</head>" +
                            "<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0;\">" +
                            "    <div style=\"max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden;\">" +
                            "        <div style=\"background-color: #28a745; color: #ffffff; padding: 25px 20px; text-align: center;\">" +
                            "            <h1 style=\"margin: 0; font-weight: 500;\">Congratulations!</h1>" +
                            "        </div>" +
                            "        <div style=\"padding: 20px 30px; line-height: 1.6;\">" +
                            "            <p style=\"font-size: 16px; color: #333333;\">Hello " + driverName + ",</p>" +
                            "            <p style=\"font-size: 16px; color: #555555;\">We are delighted to inform you that you have **successfully passed** your trial exam!</p>" +
                            "            <div style=\"background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #c3e6cb;\">" +
                            "                <h3 style=\"margin-top: 0; font-size: 18px; color: #155724; border-bottom: 2px solid #c3e6cb; padding-bottom: 10px;\">Result Details</h3>" +
                            "                <p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Result: <span style=\"color: #28a745; font-weight: bold;\">Pass</span></p>" +
                            "                <p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Notes: <span style=\"font-weight: normal; color: #555;\">" + (updatedTrialExam.getExaminerNotes() != null ? updatedTrialExam.getExaminerNotes() : "N/A") + "</span></p>" +
                            "            </div>" +
                            "            <p style=\"font-size: 16px; color: #555555;\">This is a significant step towards obtaining your license. We wish you the best!</p>" +
                            "        </div>" +
                            "        <div style=\"text-align: center; padding: 20px; font-size: 13px; color: #999999; border-top: 1px solid #eeeeee;\">" +
                            "            <p style=\"margin: 0;\">Best regards,<br>Department of Motor Traffic</p>" +
                            "        </div>" +
                            "    </div>" +
                            "</body>" +
                            "</html>";

//                    smsService.sendSms(driverPhone,
//                            "Hello " + driverName + ", Congratulations You Are passed The physical Exam of Your License Your license come to you in a year ");


                } else if ("FAIL".equals(normalizedResult)) {
                    subject = "Update on Your Trial Exam Result";
                    body = "<!DOCTYPE html>" +
                            "<html lang=\"en\">" +
                            "<head>" +
                            "    <meta charset=\"UTF-8\">" +
                            "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                            "    <title>Exam Result: Fail</title>" +
                            "</head>" +
                            "<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0;\">" +
                            "    <div style=\"max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden;\">" +
                            "        <div style=\"background-color: #dc3545; color: #ffffff; padding: 25px 20px; text-align: center;\">" +
                            "            <h1 style=\"margin: 0; font-weight: 500;\">Exam Result</h1>" +
                            "        </div>" +
                            "        <div style=\"padding: 20px 30px; line-height: 1.6;\">" +
                            "            <p style=\"font-size: 16px; color: #333333;\">Hello " + driverName + ",</p>" +
                            "            <p style=\"font-size: 16px; color: #555555;\">We regret to inform you that you were not successful on your recent trial exam. Please don't be discouraged. You can re-attempt the exam.</p>" +
                            "            <div style=\"background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #f5c6cb;\">" +
                            "                <h3 style=\"margin-top: 0; font-size: 18px; color: #721c24; border-bottom: 2px solid #f5c6cb; padding-bottom: 10px;\">Result Details</h3>" +
                            "                <p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Result: <span style=\"color: #dc3545; font-weight: bold;\">Fail</span></p>" +
                            "                <p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Notes: <span style=\"font-weight: normal; color: #555;\">" + (updatedTrialExam.getExaminerNotes() != null ? updatedTrialExam.getExaminerNotes() : "N/A") + "</span></p>" +
                            "            </div>" +
                            "            <p style=\"font-size: 16px; color: #555555;\">We hope to see you again soon. Best of luck on your next attempt!</p>" +
                            "        </div>" +
                            "        <div style=\"text-align: center; padding: 20px; font-size: 13px; color: #999999; border-top: 1px solid #eeeeee;\">" +
                            "            <p style=\"margin: 0;\">Best regards,<br>Department of Motor Traffic</p>" +
                            "        </div>" +
                            "    </div>" +
                            "</body>" +
                            "</html>";

//                    smsService.sendSms(driverPhone,
//                            "Hello " + driverName + ", Unfortunately, You Are Not passed The physical Exam of Your License Please Try Again " + updatedTrialExam.getExaminerNotes() + "Go And see your License Preview for know the next datails");

                } else { // Absent or Pending
                    subject = "Update on Your Trial Exam Status";
                    body = "<!DOCTYPE html>" +
                            "<html lang=\"en\">" +
                            "<head>" +
                            "    <meta charset=\"UTF-8\">" +
                            "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                            "    <title>Exam Status: " + normalizedResult + "</title>" +
                            "</head>" +
                            "<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0;\">" +
                            "    <div style=\"max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden;\">" +
                            "        <div style=\"background-color: #ffc107; color: #333; padding: 25px 20px; text-align: center;\">" +
                            "            <h1 style=\"margin: 0; font-weight: 500;\">Trial Exam Status Update</h1>" +
                            "        </div>" +
                            "        <div style=\"padding: 20px 30px; line-height: 1.6;\">" +
                            "            <p style=\"font-size: 16px; color: #333333;\">Hello " + driverName + ",</p>" +
                            "            <p style=\"font-size: 16px; color: #555555;\">Your trial exam status has been updated. Please see the details below:</p>" +
                            "            <div style=\"background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #ffeeba;\">" +
                            "                <h3 style=\"margin-top: 0; font-size: 18px; color: #664d03; border-bottom: 2px solid #ffeeba; padding-bottom: 10px;\">Result Details</h3>" +
                            "                <p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Result: <span style=\"color: #ffc107; font-weight: bold;\">" + normalizedResult + "</span></p>" +
                            "                <p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Notes: <span style=\"font-weight: normal; color: #555;\">" + (updatedTrialExam.getExaminerNotes() != null ? updatedTrialExam.getExaminerNotes() : "N/A") + "</span></p>" +
                            "            </div>" +
                            "            <p style=\"font-size: 16px; color: #555555;\">For any questions, please contact our office.</p>" +
                            "        </div>" +
                            "        <div style=\"text-align: center; padding: 20px; font-size: 13px; color: #999999; border-top: 1px solid #eeeeee;\">" +
                            "            <p style=\"margin: 0;\">Best regards,<br>Department of Motor Traffic</p>" +
                            "        </div>" +
                            "    </div>" +
                            "</body>" +
                            "</html>";

//                    smsService.sendSms(driverPhone,
//                            "Hello " + driverName + ",You are unable to participate to the physical exam " + updatedTrialExam.getExaminerNotes() + "Go And see your License Preview for know the next datails");

                }

                emailService.sendEmail(driverEmail, subject, body);
                log.info("Trial exam result email sent to {}", driverEmail);

            } catch (Exception e) {
                log.warn("Failed to send trial exam result email: {}", e.getMessage());
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