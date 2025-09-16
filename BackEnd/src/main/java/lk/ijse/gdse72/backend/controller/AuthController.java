package lk.ijse.gdse72.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.ijse.gdse72.backend.dto.*;
import lk.ijse.gdse72.backend.service.AuthServise;
import lk.ijse.gdse72.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AuthController {
    private final AuthServise authService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> registerUser(@Valid @RequestBody RegisterDTO registerDTO,
                                                    BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            bindingResult.getAllErrors().forEach(error -> {
                if (error instanceof FieldError) {
                    FieldError fieldError = (FieldError) error;
                    errors.put(fieldError.getField(), fieldError.getDefaultMessage());
                } else {
                    errors.put(error.getObjectName(), error.getDefaultMessage());
                }
            });
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(400, "Validation Error", errors));
        }

        try {
            return ResponseEntity.ok(new ApiResponse(
                    200,
                    "User registered successfully",
                    authService.register(registerDTO)
            ));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(400, "Database Error", e.getMostSpecificCause().getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse(500, "Server Error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> loginUser(@Valid @RequestBody AuthDTO authDTO) {
        try {
            AuthResponseDTO authResponse = authService.authenticate(authDTO);
            // Include role in response
            Map<String, Object> data = new HashMap<>();
            data.put("accessToken", authResponse.getAccessToken());
            data.put("role", authResponse.getRole());  // Ensure this is set in AuthService
            data.put("id", authResponse.getUserId());
            data.put("fullName", authResponse.getName());

            return ResponseEntity.ok(new ApiResponse(200, "Login successful", data));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401)
                    .body(new ApiResponse(401, "Authentication Failed", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> authenticate(@RequestBody String email) {
        String result = authService.forgotPassword(email);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@RequestBody Map<String, String> requestBody) {
        String email = requestBody.get("email");
        String newPassword = requestBody.get("newPassword");

        if (email == null || newPassword == null) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(400, "Email and new password are required", null));
        }

        try {
            authService.resetPassword(email, newPassword);
            return ResponseEntity.ok(new ApiResponse(200, "Password reset successfully", null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse(500, "Server Error", e.getMessage()));
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // If authentication is valid and not anonymous
        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())) {
            // Token is valid
            return ResponseEntity.ok().build();
        }

        // Token invalid or no authentication
        return ResponseEntity.status(403).build();
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse> loginWithGoogle(@RequestBody GoogleAuthDTO googleAuthDTO) {
        try {
            AuthResponseDTO authResponse = authService.authenticateGoogle(googleAuthDTO);

            Map<String, Object> data = new HashMap<>();
            data.put("accessToken", authResponse.getAccessToken());
            data.put("role", authResponse.getRole());
            data.put("id", authResponse.getUserId());
            data.put("fullName", authResponse.getName());

            return ResponseEntity.ok(new ApiResponse(200, "Google login successful", data));
        } catch (Exception e) {
            return ResponseEntity.status(401)
                    .body(new ApiResponse(401, "Google Authentication Failed", e.getMessage()));
        }
    }

    @GetMapping("/getallusers")
    public ResponseEntity<ApiResponse> getAllUsers() {
        try {
            return ResponseEntity.ok(new ApiResponse(
                    200,
                    "Users fetched successfully",
                    authService.getAllUsers()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse(500, "Server Error", e.getMessage()));
        }
    }
}