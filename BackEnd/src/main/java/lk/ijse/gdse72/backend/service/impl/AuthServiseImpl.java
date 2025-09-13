package lk.ijse.gdse72.backend.service.impl;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import lk.ijse.gdse72.backend.dto.AuthDTO;
import lk.ijse.gdse72.backend.dto.AuthResponseDTO;
import lk.ijse.gdse72.backend.dto.GoogleAuthDTO;
import lk.ijse.gdse72.backend.dto.RegisterDTO;
import lk.ijse.gdse72.backend.entity.Role;
import lk.ijse.gdse72.backend.entity.User;
import lk.ijse.gdse72.backend.entity.UserStatus;
import lk.ijse.gdse72.backend.repository.UserRepository;
//import lk.ijse.gdse72.backend.service.AuthService;
import lk.ijse.gdse72.backend.service.AuthServise;
import lk.ijse.gdse72.backend.service.EmailService;
import lk.ijse.gdse72.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiseImpl implements AuthServise {  // Fixed typo in interface name

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;


    @Value("${google.client.id}")
    private String clientId;

    @Value("${google.client.secret}")
    private String clientSecret;


    @Override
    public AuthResponseDTO authenticate(AuthDTO authDTO) {
        log.info("Authentication attempt for user: {}", authDTO.getUserName());

        User user = userRepository.findByUserName(authDTO.getUserName())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(authDTO.getPassword(), user.getPassword())) {
            log.warn("Failed login attempt for user: {}", authDTO.getUserName());
            throw new BadCredentialsException("Invalid credentials");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException("User account is not active");
        }

        String accessToken = jwtUtil.genarateToken(user.getUserName());

        log.info("User {} authenticated successfully", user.getUserName());

        return new AuthResponseDTO(
                accessToken,
                user.getRole().name(),  // Convert enum to String
                user.getUserName(),
                user.getFullName(),
                user.getId()
        );
    }

    @Override
    public String forgotPassword(String email) {
        System.out.println("Received email for forgot password: " + email);

        // Clean up email string if it comes with quotes from JSON
        if (email != null && email.startsWith("\"") && email.endsWith("\"")) {
            email = email.substring(1, email.length() - 1);
        }

        String finalEmail = email;
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + finalEmail));

        String resetLink = "http://127.0.0.1:5500/views/resetPassword.html?email=" +
                java.net.URLEncoder.encode(user.getEmail(), java.nio.charset.StandardCharsets.UTF_8);

        // HTML email template for password reset request
        String htmlContent = String.format("""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); 
                         color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #28a745; color: white; 
                         padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                         font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🔒 Password Reset Request</h2>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>You requested to reset your password for your SmartReg.lk account.</p>
                    <p>Click the button below to create a new password:</p>
                    <p style="text-align: center;">
                        <a href="%s" class="button">Reset My Password</a>
                    </p>
                    <p><strong>Security Notice:</strong></p>
                    <ul>
                        <li>This link will expire in 24 hours</li>
                        <li>If you didn't request this reset, please ignore this email</li>
                        <li>Never share this link with anyone</li>
                    </ul>
                    <p>If the button doesn't work, copy and paste this link in your browser:</p>
                    <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
                        %s
                    </p>
                </div>
                <div class="footer">
                    <p>© 2024 SmartReg.lk - All rights reserved</p>
                    <p>This is an automated email, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """, resetLink, resetLink);

        emailService.sendEmail(
                user.getEmail(),
                "🔒 Password Reset Request - SmartReg.lk",
                htmlContent
        );

        return "Password reset email sent to " + user.getEmail();
    }


    @Override
    public void resetPassword(String email, String newPassword) {
        System.out.println("Resetting password for email: " + email);

        // Clean up email string if it comes with quotes from JSON
        if (email != null && email.startsWith("\"") && email.endsWith("\"")) {
            email = email.substring(1, email.length() - 1);
        }

        String finalEmail = email;
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + finalEmail));

        // Hash the new password before saving
        String hashedPassword = passwordEncoder.encode(newPassword);

        // Update user's password
        user.setPassword(hashedPassword);

        // Save the updated user
        userRepository.save(user);

        System.out.println("Password successfully reset for user: " + user.getEmail());

        // Optional: Send confirmation email
        sendPasswordResetConfirmationEmail(user.getEmail());
    }


    @Override
    public String register(RegisterDTO registerDTO) {
        log.info("Registration attempt for user: {}", registerDTO.getUserName());

        // Validate required fields
        if (registerDTO.getEmail() == null || registerDTO.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        // Check if username or email already exists
        if (userRepository.findByUserName(registerDTO.getUserName()).isPresent()) {
            throw new DataIntegrityViolationException("Username already taken");
        }

        if (userRepository.existsByEmail(registerDTO.getEmail())) {
            throw new DataIntegrityViolationException("Email already in use");
        }

        try {
            User user = User.builder()
                    .fullName(registerDTO.getFullName())
                    .userName(registerDTO.getUserName())
                    .password(passwordEncoder.encode(registerDTO.getPassword()))
                    .email(registerDTO.getEmail())
                    .phoneNumber(registerDTO.getPhoneNumber())
                    .role(registerDTO.getRole() != null ?
                            Role.valueOf(registerDTO.getRole().toUpperCase()) :
                            Role.DRIVER)
                    .status(registerDTO.getStatus() != null ?
                            UserStatus.valueOf(registerDTO.getStatus().toUpperCase()) :
                            UserStatus.INACTIVE)
                    .isAdmin(registerDTO.isAdmin())
                    .build();

            userRepository.save(user);
            log.info("User registered successfully: {}", registerDTO.getUserName());
            return "User registered successfully";
        } catch (IllegalArgumentException e) {
            log.error("Invalid enum value during registration: {}", e.getMessage());
            throw new RuntimeException("Invalid role or status value");
        } catch (DataIntegrityViolationException e) {
            log.error("Database error during registration: {}", e.getMessage());
            throw new RuntimeException("Registration failed due to database constraints");
        }
    }

    private void sendPasswordResetConfirmationEmail(String email) {
        String confirmationContent = String.format("""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #28a745 0%%, #20c997 100%%); 
                         color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                .success { color: #28a745; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>✅ Password Reset Successful</h2>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p class="success">Your password has been successfully reset!</p>
                    <p>Your SmartReg.lk account password has been updated. You can now log in with your new password.</p>
                    <p><strong>Security Tips:</strong></p>
                    <ul>
                        <li>Keep your password secure and don't share it with anyone</li>
                        <li>Use a strong, unique password for your account</li>
                        <li>If you didn't make this change, contact support immediately</li>
                    </ul>
                    <p>If you have any questions or concerns, please contact our support team.</p>
                </div>
                <div class="footer">
                    <p>© 2024 SmartReg.lk - All rights reserved</p>
                    <p>This is an automated email, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """);

        try {
            emailService.sendEmail(
                    email,
                    "✅ Password Reset Successful - SmartReg.lk",
                    confirmationContent
            );
        } catch (Exception e) {
            // Log error but don't fail the password reset if email fails
            System.err.println("Failed to send confirmation email: " + e.getMessage());
        }
    }

    @Override
    public AuthResponseDTO authenticateGoogle(GoogleAuthDTO googleAuthDTO) {
        try {
            JacksonFactory jacksonFactory = JacksonFactory.getDefaultInstance();
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    jacksonFactory
            )
                    .setAudience(Collections.singletonList(clientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(googleAuthDTO.getTokenId());
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();

                String email = payload.getEmail();
                String name = (String) payload.get("name");
                String googleId = payload.getSubject();

                log.info("Google authentication attempt for email: {}", email);

                // Find existing user or create new one
                User user = userRepository.findByEmail(email).orElseGet(() -> {
                    log.info("Creating new Google user: {}", email);
                    User newUser = User.builder()
                            .email(email)
                            .userName(email) // Use email as username for consistency
                            .fullName(name)
                            .password("") // Google users don't need password
                            .phoneNumber(0) // Default phone number (you might want to make this nullable)
                            .role(Role.DRIVER) // Set to ADMIN for dashboard access
                            .status(UserStatus.ACTIVE) // Set active status
                            .isAdmin(false) // Set admin flag
                            .build();
                    return userRepository.save(newUser);
                });

                // Ensure existing user has proper role and status
                boolean needsUpdate = false;

                if (user.getRole() == null) {
                    user.setRole(Role.DRIVER);
                    needsUpdate = true;
                }

                if (user.getStatus() == null || user.getStatus() != UserStatus.ACTIVE) {
                    user.setStatus(UserStatus.ACTIVE);
                    needsUpdate = true;
                }

                // Make sure userName is set (for JWT compatibility)
                if (user.getUserName() == null || user.getUserName().isEmpty()) {
                    user.setUserName(email);
                    needsUpdate = true;
                }

                // Set admin flag if not set
//                if (!user.isAdmin()) {
//                    user.setIsAdmin(true);
//                    needsUpdate = true;
//                }

                if (needsUpdate) {
                    userRepository.save(user);
                }

                // Generate JWT token with enhanced claims using the new method
                String token = jwtUtil.generateTokenWithClaims(user);

                log.info("Google user {} authenticated successfully with role: {}", user.getEmail(), user.getRole());

                // Return response in same format as normal login
                return new AuthResponseDTO(
                        token,
                        user.getRole().name(),
                        user.getUserName(),
                        user.getFullName(),
                        user.getId()
                );

            } else {
                throw new RuntimeException("Invalid Google ID Token");
            }
        } catch (Exception e) {
            log.error("Google authentication failed: {}", e.getMessage(), e);
            throw new RuntimeException("Google login failed: " + e.getMessage());
        }
    }
}