package lk.ijse.gdse72.backend.service.impl;

import lk.ijse.gdse72.backend.dto.AuthDTO;
import lk.ijse.gdse72.backend.dto.AuthResponseDTO;
import lk.ijse.gdse72.backend.dto.RegisterDTO;
import lk.ijse.gdse72.backend.entity.Role;
import lk.ijse.gdse72.backend.entity.User;
import lk.ijse.gdse72.backend.entity.UserStatus;
import lk.ijse.gdse72.backend.repository.UserRepository;
import lk.ijse.gdse72.backend.service.AuthServise;
import lk.ijse.gdse72.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiseImpl implements AuthServise {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public AuthResponseDTO authenticate(AuthDTO authDTO) {
        User user = userRepository.findByUserName(authDTO.getUserName())
                .orElseThrow(() -> new RuntimeException("User not found with username: " + authDTO.getUserName()));

        if (!passwordEncoder.matches(authDTO.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Incorrect Password");
        }

        String accessToken = jwtUtil.genarateToken(user.getUserName());
        return new AuthResponseDTO(accessToken);
    }

    @Override
    public String register(RegisterDTO registerDTO) {
        // Validate required fields
        if (registerDTO.getEmail() == null || registerDTO.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        // Check if username or email already exists
        if (userRepository.findByUserName(registerDTO.getUserName()).isPresent()) {
            throw new RuntimeException("Username already taken: " + registerDTO.getUserName());
        }

        if (userRepository.existsByEmail(registerDTO.getEmail())) {
            throw new RuntimeException("Email already in use: " + registerDTO.getEmail());
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
            return "User Registration Successful";
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Database error: " + e.getMostSpecificCause().getMessage());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role or status value: " + e.getMessage());
        }
    }
}

//
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
//        // Check if user is active
//        if (user.getStatus() != UserStatus.ACTIVE) {
//            throw new BadCredentialsException("Account is not active. Status: " + user.getStatus());
//        }
//
//        if (!passwordEncoder.matches(authDTO.getPassword(), user.getPassword())) {
//            throw new BadCredentialsException("Incorrect Password");
//        }
//
//        // Generate token with user details
//        String accessToken = jwtUtil.generateTokenWithClaims(
//                user.getUserName(),
//                user.getRole().name(),
//                user.isAdmin()
//        );
//
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