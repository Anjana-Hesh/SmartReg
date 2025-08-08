package lk.ijse.gdse72.backend.service.impl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lk.ijse.gdse72.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public void sendEmail(String to, String subject, String body) {
        try {
            // Use MimeMessage instead of SimpleMailMessage for HTML support
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("anjanaheshan676@gmail.com");
            helper.setTo(to);
            helper.setSubject(subject);

            // Check if content is HTML or plain text
            if (isHtmlContent(body)) {
                helper.setText(body, true); // true = HTML content
            } else {
                helper.setText(body, false); // false = plain text
            }

            mailSender.send(message);
            System.out.println("Email sent successfully to: " + to);

        } catch (MessagingException e) {
            System.err.println("Failed to send email: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Unexpected error sending email: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    // Helper method to detect HTML content
    private boolean isHtmlContent(String content) {
        return content != null &&
                (content.toLowerCase().contains("<!doctype html") ||
                        content.toLowerCase().contains("<html") ||
                        content.toLowerCase().contains("<body") ||
                        content.toLowerCase().contains("<div"));
    }

    // Additional method for explicit HTML emails
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("anjanaheshan676@gmail.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // Always HTML

            mailSender.send(message);
            System.out.println("HTML email sent successfully to: " + to);

        } catch (MessagingException e) {
            System.err.println("Failed to send HTML email: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send HTML email: " + e.getMessage());
        }
    }

    // Method for plain text emails only
    public void sendPlainTextEmail(String to, String subject, String textBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            helper.setFrom("anjanaheshan676@gmail.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(textBody, false); // Always plain text

            mailSender.send(message);
            System.out.println("Plain text email sent successfully to: " + to);

        } catch (MessagingException e) {
            System.err.println("Failed to send plain text email: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send plain text email: " + e.getMessage());
        }
    }
}