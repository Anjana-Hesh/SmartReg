package lk.ijse.gdse72.backend.service.impl;

import lk.ijse.gdse72.backend.dto.WrittenExamDto;
import lk.ijse.gdse72.backend.dto.WrittenExamRequestDto;
import lk.ijse.gdse72.backend.entity.Application;
import lk.ijse.gdse72.backend.entity.WrittenExam;
import lk.ijse.gdse72.backend.repository.ApplicationRepository;
import lk.ijse.gdse72.backend.repository.WrittenExamRepository;
import lk.ijse.gdse72.backend.service.WrittenExamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WrittenExamServiceImpl implements WrittenExamService {

    private final WrittenExamRepository writtenExamRepository;
    private final ApplicationRepository applicationRepository;
    private final EmailServiceImpl emailService;

    @Override
    public WrittenExamDto scheduleWrittenExam(WrittenExamRequestDto requestDto) {
        log.info("Scheduling written exam for application ID: {}", requestDto.getApplicationId());

        Application application = applicationRepository.findById(requestDto.getApplicationId())
                .orElseThrow(() -> new RuntimeException("Application not found with ID: " + requestDto.getApplicationId()));

        if (writtenExamRepository.existsByApplicationId(requestDto.getApplicationId())) {
            throw new RuntimeException("Written exam already scheduled for this application");
        }

        WrittenExam writtenExam = WrittenExam.builder()
                .writtenExamDate(requestDto.getWrittenExamDate())
                .writtenExamTime(requestDto.getWrittenExamTime())
                .writtenExamLocation(requestDto.getWrittenExamLocation() != null ?
                        requestDto.getWrittenExamLocation() : "Colombo Department of Motor Traffic")
                .note(requestDto.getNote())
                .writtenExamResult(requestDto.getWrittenExamResult())
                .application(application)
                .build();

        WrittenExam savedExam = writtenExamRepository.save(writtenExam);
        log.info("Written exam scheduled successfully with ID: {}", savedExam.getId());

        // Send email to driver
        try {
            String driverName = application.getDriver().getFullName();
            String driverEmail = application.getDriver().getEmail();

            String subject = "Your Written Exam Has Been Scheduled";
            String body = "<!DOCTYPE html>\n" +
                    "<html lang=\"en\">\n" +
                    "<head>\n" +
                    "    <meta charset=\"UTF-8\">\n" +
                    "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                    "    <title>Written Exam Scheduled</title>\n" +
                    "</head>\n" +
                    "<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; background-color: #f0f2f5; margin: 0; padding: 0;\">\n" +
                    "    <div style=\"max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden;\">\n" +
                    "\n" +
                    "        \n" +
                    "        <div style=\"background-color: #007bff; color: #ffffff; padding: 25px 20px; text-align: center;\">\n" +
                    "            <h1 style=\"margin: 0; font-weight: 500;\">Your Exam Has Been Scheduled</h1>\n" +
                    "        </div>\n" +
                    "\n" +
                    "        \n" +
                    "        <div style=\"padding: 20px 30px; line-height: 1.6;\">\n" +
                    "            <p style=\"font-size: 16px; color: #333333;\">Hello " + driverName + ",</p>\n" +
                    "            <p style=\"font-size: 16px; color: #555555;\">We are pleased to inform you that your written exam has been successfully scheduled. Below are the details for your exam:</p>\n" +
                    "\n" +
                    "            <div style=\"background-color: #e9ecef; padding: 20px; border-radius: 8px; margin: 25px 0;\">\n" +
                    "                <h3 style=\"margin-top: 0; font-size: 18px; color: #007bff; border-bottom: 2px solid #ced4da; padding-bottom: 10px;\">Exam Details</h3>\n" +
                    "                <table style=\"width: 100%; font-size: 15px;\">\n" +
                    "                    <tr>\n" +
                    "                        <td style=\"padding: 5px 0; font-weight: 600; color: #333;\">Date:</td>\n" +
                    "                        <td style=\"padding: 5px 0; color: #555;\">" + savedExam.getWrittenExamDate() + "</td>\n" +
                    "                    </tr>\n" +
                    "                    <tr>\n" +
                    "                        <td style=\"padding: 5px 0; font-weight: 600; color: #333;\">Time:</td>\n" +
                    "                        <td style=\"padding: 5px 0; color: #555;\">" + savedExam.getWrittenExamTime() + "</td>\n" +
                    "                    </tr>\n" +
                    "                    <tr>\n" +
                    "                        <td style=\"padding: 5px 0; font-weight: 600; color: #333;\">Location:</td>\n" +
                    "                        <td style=\"padding: 5px 0; color: #555;\">" + savedExam.getWrittenExamLocation() + "</td>\n" +
                    "                    </tr>\n" +
                    "                </table>\n" +
                    "            </div>\n" +
                    "\n" +
                    "            <p style=\"font-size: 15px; color: #666666; margin-top: 20px;\">\n" +
                    "                <span style=\"font-weight: 600; color: #333333;\">Note:</span> " + savedExam.getNote() + "\n" +
                    "            </p>\n" +
                    "\n" +
                    "            <p style=\"font-size: 16px; color: #555555;\">Please arrive at the location at least 15 minutes before your scheduled time. We wish you the best of luck!</p>\n" +
                    "        </div>\n" +
                    "\n" +
                    "        \n" +
                    "        <div style=\"text-align: center; padding: 20px; font-size: 13px; color: #999999; border-top: 1px solid #eeeeee;\">\n" +
                    "            <p style=\"margin: 0;\">Department of Motor Traffic</p>\n" +
                    "            <p style=\"margin: 5px 0 0;\">This is an automated email. Please do not reply.</p>\n" +
                    "        </div>\n" +
                    "    </div>\n" +
                    "</body>\n" +
                    "</html>";

            emailService.sendHtmlEmail(driverEmail, subject, body);
            log.info("Written exam schedule email sent to {}", driverEmail);

        } catch (Exception e) {
            log.warn("Failed to send exam schedule email: {}", e.getMessage());
        }

        return convertToDto(savedExam);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<WrittenExamDto> getWrittenExamById(Long examId) {
        log.info("Fetching written exam with ID: {}", examId);
        return writtenExamRepository.findByIdWithApplication(examId)
                .map(this::convertToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<WrittenExamDto> getWrittenExamByApplicationId(Long applicationId) {
        log.info("Fetching written exam for application ID: {}", applicationId);
        try {
            Optional<WrittenExam> examOpt = writtenExamRepository.findByApplicationId(applicationId);

            if (examOpt.isEmpty()) {
                log.debug("No written exam found for application ID: {}", applicationId);
                return Optional.empty();
            }

            WrittenExam exam = examOpt.get();
            log.debug("Found written exam: {}", exam.getId());

            // Verify application is loaded
            if (exam.getApplication() == null) {
                log.warn("Written exam {} has no application loaded, attempting to reload", exam.getId());
                // Try to reload the exam with application
                exam = writtenExamRepository.findByIdWithApplication(exam.getId())
                        .orElseThrow(() -> new IllegalStateException("Could not reload written exam with application"));
            }

            return Optional.of(convertToDto(exam));
        } catch (Exception e) {
            log.error("Error fetching written exam for application ID: " + applicationId, e);
            throw e; // Re-throw to be handled by controller
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<WrittenExamDto> getAllWrittenExams() {
        log.info("Fetching all written exams");
        return writtenExamRepository.findAllWithApplication()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public WrittenExamDto updateWrittenExam(Long examId, WrittenExamRequestDto requestDto) {
        log.info("Updating written exam with ID: {}", examId);

        WrittenExam existingExam = writtenExamRepository.findByIdWithApplication(examId)
                .orElseThrow(() -> new RuntimeException("Written exam not found with ID: " + examId));

        // Update fields
        existingExam.setWrittenExamDate(requestDto.getWrittenExamDate());
        existingExam.setWrittenExamTime(requestDto.getWrittenExamTime());
        existingExam.setWrittenExamLocation(requestDto.getWrittenExamLocation());
        existingExam.setNote(requestDto.getNote());

        if (requestDto.getWrittenExamResult() != null) {
            existingExam.setWrittenExamResult(requestDto.getWrittenExamResult());
        }

        WrittenExam updatedExam = writtenExamRepository.save(existingExam);
        log.info("Written exam updated successfully with ID: {}", updatedExam.getId());

        return convertToDto(updatedExam);
    }

    @Override
    public void updateExamResult(Long examId, String result, String note) {
        WrittenExam writtenExam = writtenExamRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Written exam not found"));

        writtenExam.setWrittenExamResult(result);
        writtenExam.setNote(note);

        writtenExamRepository.save(writtenExam);
    }

    @Override
    public void deleteWrittenExam(Long examId) {
        log.info("Deleting written exam with ID: {}", examId);

        if (!writtenExamRepository.existsById(examId)) {
            throw new RuntimeException("Written exam not found with ID: " + examId);
        }

        writtenExamRepository.deleteById(examId);
        log.info("Written exam deleted successfully with ID: {}", examId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WrittenExamDto> getWrittenExamsByResult(String result) {
        log.info("Fetching written exams with result: {}", result);
        return writtenExamRepository.findByWrittenExamResultWithApplication(result)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByApplicationId(Long applicationId) {
        return writtenExamRepository.existsByApplicationId(applicationId);
    }

    @Override
    public WrittenExam updateWrittenExamResult(Long examId, String result, String note, LocalDate trialDate, LocalDate nextExamDate) {
        WrittenExam writtenExam = writtenExamRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Written exam not found"));

        writtenExam.setWrittenExamResult(result);
        if (note != null) {
            writtenExam.setNote(note);
        }
        if (trialDate != null) {
            writtenExam.setTrialDate(trialDate);
        }
        if (nextExamDate != null) {
            writtenExam.setNextExamDate(nextExamDate);
        }

        return writtenExamRepository.save(writtenExam);
    }


    @Override
    @Transactional
    public void updateExamResultWithDates(Long examId, String result, String note,
                                          LocalDate trialDate, LocalDate nextExamDate) {
        WrittenExam writtenExam = writtenExamRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Written exam not found"));

        writtenExam.setWrittenExamResult(result);
        writtenExam.setNote(note);
        writtenExam.setTrialDate(trialDate);
        writtenExam.setNextExamDate(nextExamDate);

        writtenExamRepository.save(writtenExam);

        String driverName = writtenExam.getApplication().getDriver().getFullName();
        String driverEmail = writtenExam.getApplication().getDriver().getEmail();
        String subject;
        String body;

        // Conditional logic to generate email content based on result
        if ("Pass".equalsIgnoreCase(result)) {
            subject = "Congratulations! Your Exam Result is a Pass";
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
                    "            <p style=\"font-size: 16px; color: #555555;\">We are delighted to inform you that you have **successfully passed** your written exam. Great job!</p>" +
                    "            <div style=\"background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #c3e6cb;\">" +
                    "                <h3 style=\"margin-top: 0; font-size: 18px; color: #155724; border-bottom: 2px solid #c3e6cb; padding-bottom: 10px;\">Next Steps</h3>" +
                    "                <p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Result: <span style=\"color: #28a745; font-weight: bold;\">Pass</span></p>" +
                    (note != null ? "<p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Note: <span style=\"font-weight: normal; color: #555;\">" + note + "</span></p>" : "") +
                    (trialDate != null ? "<p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Trial Date: <span style=\"font-weight: normal; color: #555;\">" + trialDate + "</span></p>" : "") +
                    "            </div>" +
                    "            <p style=\"font-size: 16px; color: #555555;\">Please review the details above. We wish you the best for your next step.</p>" +
                    "        </div>" +
                    "        <div style=\"text-align: center; padding: 20px; font-size: 13px; color: #999999; border-top: 1px solid #eeeeee;\">" +
                    "            <p style=\"margin: 0;\">Best regards,<br>Department of Motor Traffic</p>" +
                    "        </div>" +
                    "    </div>" +
                    "</body>" +
                    "</html>";

        } else if ("Fail".equalsIgnoreCase(result)) {
            subject = "Update on Your Exam Result";
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
                    "            <p style=\"font-size: 16px; color: #555555;\">We regret to inform you that you were not successful on your recent written exam. Please don't be discouraged. You can re-attempt the exam.</p>" +
                    "            <div style=\"background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #f5c6cb;\">" +
                    "                <h3 style=\"margin-top: 0; font-size: 18px; color: #721c24; border-bottom: 2px solid #f5c6cb; padding-bottom: 10px;\">Details</h3>" +
                    "                <p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Result: <span style=\"color: #dc3545; font-weight: bold;\">Fail</span></p>" +
                    (note != null ? "<p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Note: <span style=\"font-weight: normal; color: #555;\">" + note + "</span></p>" : "") +
                    (nextExamDate != null ? "<p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Next Exam Date: <span style=\"font-weight: normal; color: #555;\">" + nextExamDate + "</span></p>" : "") +
                    "            </div>" +
                    "            <p style=\"font-size: 16px; color: #555555;\">We hope to see you again soon. Best of luck on your next attempt!</p>" +
                    "        </div>" +
                    "        <div style=\"text-align: center; padding: 20px; font-size: 13px; color: #999999; border-top: 1px solid #eeeeee;\">" +
                    "            <p style=\"margin: 0;\">Best regards,<br>Department of Motor Traffic</p>" +
                    "        </div>" +
                    "    </div>" +
                    "</body>" +
                    "</html>";

        } else { // Absent or other status
            subject = "Update on Your Written Exam Status";
            body = "<!DOCTYPE html>" +
                    "<html lang=\"en\">" +
                    "<head>" +
                    "    <meta charset=\"UTF-8\">" +
                    "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                    "    <title>Exam Status: " + result + "</title>" +
                    "</head>" +
                    "<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0;\">" +
                    "    <div style=\"max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden;\">" +
                    "        <div style=\"background-color: #ffc107; color: #333; padding: 25px 20px; text-align: center;\">" +
                    "            <h1 style=\"margin: 0; font-weight: 500;\">Exam Status</h1>" +
                    "        </div>" +
                    "        <div style=\"padding: 20px 30px; line-height: 1.6;\">" +
                    "            <p style=\"font-size: 16px; color: #333333;\">Hello " + driverName + ",</p>" +
                    "            <p style=\"font-size: 16px; color: #555555;\">Your written exam status has been updated. Please see the details below:</p>" +
                    "            <div style=\"background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #ffeeba;\">" +
                    "                <h3 style=\"margin-top: 0; font-size: 18px; color: #664d03; border-bottom: 2px solid #ffeeba; padding-bottom: 10px;\">Details</h3>" +
                    "                <p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Result: <span style=\"color: #ffc107; font-weight: bold;\">" + result + "</span></p>" +
                    (note != null ? "<p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Note: <span style=\"font-weight: normal; color: #555;\">" + note + "</span></p>" : "") +
                    (nextExamDate != null ? "<p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Next Exam Date: <span style=\"font-weight: normal; color: #555;\">" + nextExamDate + "</span></p>" : "") +
                    "            </div>" +
                    "            <p style=\"font-size: 16px; color: #555555;\">For any questions, please contact our office.</p>" +
                    "        </div>" +
                    "        <div style=\"text-align: center; padding: 20px; font-size: 13px; color: #999999; border-top: 1px solid #eeeeee;\">" +
                    "            <p style=\"margin: 0;\">Best regards,<br>Department of Motor Traffic</p>" +
                    "        </div>" +
                    "    </div>" +
                    "</body>" +
                    "</html>";
        }

        emailService.sendEmail(driverEmail, subject, body);
    }

    private WrittenExamDto convertToDto(WrittenExam writtenExam) {
        Objects.requireNonNull(writtenExam, "WrittenExam cannot be null");
        Objects.requireNonNull(writtenExam.getApplication(), "Application cannot be null");

        WrittenExamDto.WrittenExamDtoBuilder builder = WrittenExamDto.builder()
                .id(writtenExam.getId())
                .writtenExamDate(writtenExam.getWrittenExamDate())
                .writtenExamTime(writtenExam.getWrittenExamTime())
                .writtenExamLocation(writtenExam.getWrittenExamLocation())
                .note(writtenExam.getNote())
                .writtenExamResult(writtenExam.getWrittenExamResult())
                .applicationId(writtenExam.getApplication().getId())
                // Add the new fields
                .nextExamDate(writtenExam.getNextExamDate())
                .trialDate(writtenExam.getTrialDate());

        // Safely handle driver information
        try {
            Application app = writtenExam.getApplication();
            if (app.getDriver() != null) {
                builder.driverName(app.getDriver().getFullName());
            } else {
                log.debug("Application {} has no driver associated", app.getId());
                builder.driverName(null);
            }

            builder.licenseType(app.getLicenseType())
                    .examLanguage(app.getExamLanguage());
        } catch (Exception e) {
            log.error("Error converting application/driver details for exam ID: {}", writtenExam.getId(), e);
            // Set safe defaults
            builder.driverName(null)
                    .licenseType(null)
                    .examLanguage(null);
        }

        return builder.build();
    }
}