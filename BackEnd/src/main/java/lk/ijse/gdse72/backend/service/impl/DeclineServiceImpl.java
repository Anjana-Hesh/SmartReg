package lk.ijse.gdse72.backend.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lk.ijse.gdse72.backend.dto.DeclineDTO;
import lk.ijse.gdse72.backend.entity.Application;
import lk.ijse.gdse72.backend.entity.DeclineEntity;
import lk.ijse.gdse72.backend.repository.ApplicationRepository;
import lk.ijse.gdse72.backend.repository.DeclineRepo;
import lk.ijse.gdse72.backend.service.DeclineService;
import lk.ijse.gdse72.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class DeclineServiceImpl implements DeclineService {

    private final DeclineRepo declineRepo;
    private final ApplicationRepository applicationRepo;
    private final ModelMapper modelMapper;
    private final EmailService emailService;

    @Override
    public DeclineDTO createDecline(DeclineDTO declineDTO) {
        try {
            if (declineDTO.getApplicationId() == null) {
                throw new IllegalArgumentException("Application ID is required");
            }
            if (declineDTO.getDeclineReason() == null || declineDTO.getDeclineReason().isEmpty()) {
                throw new IllegalArgumentException("Decline reason is required");
            }

            // Create new decline entity
            DeclineEntity declineEntity = new DeclineEntity();
            declineEntity.setDeclineReason(declineDTO.getDeclineReason());
            declineEntity.setDeclineNotes(declineDTO.getDeclineNotes());
            declineEntity.setDeclinedBy(declineDTO.getDeclinedBy());
            declineEntity.setDeclinedAt(LocalDateTime.now());

            Application application = new Application();
            application.setId(declineDTO.getApplicationId());
            declineEntity.setApplication(application);

            DeclineEntity savedEntity = declineRepo.save(declineEntity);

            // ===== Send Decline Email =====
            try {
                Application fullApplication = applicationRepo.findById(declineDTO.getApplicationId())
                        .orElseThrow(() -> new RuntimeException("Application not found"));

                String driverName = fullApplication.getDriver().getFullName();
                String driverEmail = fullApplication.getDriver().getEmail();

                String subject = "Your Application Has Been Declined";
                String body = "<!DOCTYPE html>\n" +
                        "<html lang=\"en\">\n" +
                        "<head>\n" +
                        "    <meta charset=\"UTF-8\">\n" +
                        "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                        "    <title>Application Declined</title>\n" +
                        "</head>\n" +
                        "<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; background-color: #f0f2f5; margin: 0; padding: 0;\">\n" +
                        "    <div style=\"max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden;\">\n" +
                        "\n" +
                        "        \n" +
                        "        <div style=\"background-color: #dc3545; color: #ffffff; padding: 25px 20px; text-align: center;\">\n" +
                        "            <h1 style=\"margin: 0; font-weight: 500;\">Application Declined</h1>\n" +
                        "        </div>\n" +
                        "\n" +
                        "        \n" +
                        "        <div style=\"padding: 20px 30px; line-height: 1.6;\">\n" +
                        "            <p style=\"font-size: 16px; color: #333333;\">Hello " + driverName + ",</p>\n" +
                        "            <p style=\"font-size: 16px; color: #555555;\">We regret to inform you that your recent application has been declined. After a careful review, we were unable to proceed with your application at this time.</p>\n" +
                        "\n" +
                        "            \n" +
                        "            <div style=\"background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #f5c6cb;\">\n" +
                        "                <h3 style=\"margin-top: 0; font-size: 18px; color: #721c24; border-bottom: 2px solid #f5c6cb; padding-bottom: 10px;\">Reason for Decline</h3>\n" +
                        "                <p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Reason:</p>\n" +
                        "                <p style=\"margin: 5px 0 15px; color: #555;\">" + declineDTO.getDeclineReason() + "</p>\n" +
                        "\n" +
                        "                <p style=\"margin: 5px 0; font-weight: 600; color: #333;\">Notes:</p>\n" +
                        "                <p style=\"margin: 5px 0; color: #555;\">" + (declineDTO.getDeclineNotes() != null ? declineDTO.getDeclineNotes() : "N/A") + "</p>\n" +
                        "            </div>\n" +
                        "\n" +
                        "            <p style=\"font-size: 16px; color: #555555;\">We understand this may be disappointing. We encourage you to review the reason provided and, if you wish to re-apply in the future, please ensure all required documentation and criteria are met.</p>\n" +
                        "        </div>\n" +
                        "\n" +
                        "        \n" +
                        "        <div style=\"text-align: center; padding: 20px; font-size: 13px; color: #999999; border-top: 1px solid #eeeeee;\">\n" +
                        "            <p style=\"margin: 0;\">Best Regards,<br>Department of Motor Traffic</p>\n" +
                        "            <p style=\"margin: 5px 0 0;\">This is an automated notification. Please do not reply.</p>\n" +
                        "        </div>\n" +
                        "    </div>\n" +
                        "</body>\n" +
                        "</html>";

                emailService.sendEmail(driverEmail, subject, body);
                log.info("Decline email sent to {}", driverEmail);

            } catch (Exception e) {
                log.warn("Failed to send decline email: {}", e.getMessage());
            }

            return modelMapper.map(savedEntity, DeclineDTO.class);

        } catch (Exception e) {
            throw new RuntimeException("Failed to create decline record: " + e.getMessage(), e);
        }
    }


    @Override
    public DeclineDTO findDeclineByApplicationId(Long applicationId) {
        if (applicationId == null) {
            throw new IllegalArgumentException("Application ID cannot be null or empty");
        }

        // Find the application to ensure it exists
        Application application = applicationRepo.findById(applicationId)
                .orElseThrow(() -> new EntityNotFoundException("Application not found with ID: " + applicationId));

        return declineRepo.findByApplication(application)
                .map(decline -> modelMapper.map(decline, DeclineDTO.class))
                .orElse(null);
    }

    @Override
    public List<DeclineDTO> getAllDeclines() {
        return declineRepo.findAll().stream()
                .map(decline -> modelMapper.map(decline, DeclineDTO.class))
                .collect(Collectors.toList());
    }
}