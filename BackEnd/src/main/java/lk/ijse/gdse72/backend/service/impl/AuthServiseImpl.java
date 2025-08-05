//package lk.ijse.gdse72.backend.service.impl;
//
//import lk.ijse.gdse72.backend.dto.AuthDTO;
//import lk.ijse.gdse72.backend.dto.AuthResponseDTO;
//import lk.ijse.gdse72.backend.dto.RegisterDTO;
//import lk.ijse.gdse72.backend.entity.Role;
//import lk.ijse.gdse72.backend.entity.User;
//import lk.ijse.gdse72.backend.entity.UserStatus;
//import lk.ijse.gdse72.backend.repository.UserRepository;
//import lk.ijse.gdse72.backend.service.AuthServise;
//import lk.ijse.gdse72.backend.util.JwtUtil;
//import lombok.RequiredArgsConstructor;
//import org.springframework.dao.DataIntegrityViolationException;
//import org.springframework.security.authentication.BadCredentialsException;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.stereotype.Service;
//
//@Service
//@RequiredArgsConstructor
//public class AuthServiseImpl implements AuthServise {
//
//    private final UserRepository userRepository;
//    private final PasswordEncoder passwordEncoder;
//    private final JwtUtil jwtUtil;
//
//    @Override
//    public AuthResponseDTO authenticate(AuthDTO authDTO) {
//        User user = userRepository.findByUserName(authDTO.getUserName())
//                .orElseThrow(() -> new RuntimeException("User not found with username: " + authDTO.getUserName()));
//
//        if (!passwordEncoder.matches(authDTO.getPassword(), user.getPassword())) {
//            throw new BadCredentialsException("Incorrect Password");
//        }
//
//        String accessToken = jwtUtil.genarateToken(user.getUserName());
//        return new AuthResponseDTO(accessToken);
//    }
//
//    @Override
//    public String register(RegisterDTO registerDTO) {
//        // Validate required fields
//        if (registerDTO.getEmail() == null || registerDTO.getEmail().trim().isEmpty()) {
//            throw new IllegalArgumentException("Email is required");
//        }
//
//        // Check if username or email already exists
//        if (userRepository.findByUserName(registerDTO.getUserName()).isPresent()) {
//            throw new RuntimeException("Username already taken: " + registerDTO.getUserName());
//        }
//
//        if (userRepository.existsByEmail(registerDTO.getEmail())) {
//            throw new RuntimeException("Email already in use: " + registerDTO.getEmail());
//        }
//
//        try {
//            User user = User.builder()
//                    .fullName(registerDTO.getFullName())
//                    .userName(registerDTO.getUserName())
//                    .password(passwordEncoder.encode(registerDTO.getPassword()))
//                    .email(registerDTO.getEmail())
//                    .phoneNumber(registerDTO.getPhoneNumber())
//                    .role(registerDTO.getRole() != null ?
//                            Role.valueOf(registerDTO.getRole().toUpperCase()) :
//                            Role.DRIVER)
//                    .status(registerDTO.getStatus() != null ?
//                            UserStatus.valueOf(registerDTO.getStatus().toUpperCase()) :
//                            UserStatus.INACTIVE)
//                    .isAdmin(registerDTO.isAdmin())
//                    .build();
//
//            userRepository.save(user);
//            return "User Registration Successful";
//        } catch (DataIntegrityViolationException e) {
//            throw new RuntimeException("Database error: " + e.getMostSpecificCause().getMessage());
//        } catch (IllegalArgumentException e) {
//            throw new RuntimeException("Invalid role or status value: " + e.getMessage());
//        }
//    }
//}

package lk.ijse.gdse72.backend.service.impl;

import lk.ijse.gdse72.backend.dto.AuthDTO;
import lk.ijse.gdse72.backend.dto.AuthResponseDTO;
import lk.ijse.gdse72.backend.dto.RegisterDTO;
import lk.ijse.gdse72.backend.entity.Role;
import lk.ijse.gdse72.backend.entity.User;
import lk.ijse.gdse72.backend.entity.UserStatus;
import lk.ijse.gdse72.backend.repository.UserRepository;
//import lk.ijse.gdse72.backend.service.AuthService;
import lk.ijse.gdse72.backend.service.AuthServise;
import lk.ijse.gdse72.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiseImpl implements AuthServise {  // Fixed typo in interface name

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

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
}