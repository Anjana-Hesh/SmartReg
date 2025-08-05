package lk.ijse.gdse72.backend.controller;

import jakarta.validation.Valid;
import lk.ijse.gdse72.backend.dto.ApiResponse;
import lk.ijse.gdse72.backend.dto.AuthDTO;
import lk.ijse.gdse72.backend.dto.AuthResponseDTO;
import lk.ijse.gdse72.backend.dto.RegisterDTO;
import lk.ijse.gdse72.backend.service.AuthServise;
import lk.ijse.gdse72.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin
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

//    @PostMapping("/login")
//    public ResponseEntity<ApiResponse> loginUser(@Valid @RequestBody AuthDTO authDTO) {
//        try {
//            AuthResponseDTO authResponse = authService.authenticate(authDTO);
//            return ResponseEntity.ok(new ApiResponse(
//                    200,
//                    "Login successful",
//                    authResponse
//            ));
//        } catch (AuthenticationException e) {
//            return ResponseEntity.status(401)
//                    .body(new ApiResponse(401, "Authentication Failed", e.getMessage()));
//        } catch (Exception e) {
//            return ResponseEntity.internalServerError()
//                    .body(new ApiResponse(500, "Login Error", e.getMessage()));
//        }
//    }


    @PostMapping("/login")
    public ResponseEntity<ApiResponse> loginUser(@Valid @RequestBody AuthDTO authDTO) {
        try {
            AuthResponseDTO authResponse = authService.authenticate(authDTO);
            // Include role in response
            Map<String, Object> data = new HashMap<>();
            data.put("accessToken", authResponse.getAccessToken());
            data.put("role", authResponse.getRole());  // Ensure this is set in AuthService

            return ResponseEntity.ok(new ApiResponse(200, "Login successful", data));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401)
                    .body(new ApiResponse(401, "Authentication Failed", e.getMessage()));
        }
    }

//    // AuthController.java
//    @GetMapping("/validate")
//    public ResponseEntity<ApiResponse> validateToken(@RequestHeader("Authorization") String authHeader) {
//        try {
//            String token = authHeader.substring(7); // Remove "Bearer "
//            boolean isValid = jwtUtil.validateToken(token);
//            return ResponseEntity.ok(new ApiResponse(200, "Token validation", isValid));
//        } catch (Exception e) {
//            return ResponseEntity.status(401).body(new ApiResponse(401, "Invalid token", false));
//        }
//    }
}