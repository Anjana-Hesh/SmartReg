package lk.ijse.gdse72.backend.controller;

import jakarta.validation.Valid;
import lk.ijse.gdse72.backend.dto.ApiResponse;
import lk.ijse.gdse72.backend.dto.AuthDTO;
import lk.ijse.gdse72.backend.dto.RegisterDTO;
import lk.ijse.gdse72.backend.service.AuthServise;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("api/auth")
@RequiredArgsConstructor
@CrossOrigin
public class AuthController {
    private final AuthServise authService;

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
        return ResponseEntity.ok(new ApiResponse(
                200,
                "OK",
                authService.authenticate(authDTO)
        ));
    }
}


//
//package lk.ijse.gdse72.backend.controller;
//
//import jakarta.servlet.http.Cookie;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import jakarta.validation.Valid;
//import lk.ijse.gdse72.backend.dto.ApiResponse;
//import lk.ijse.gdse72.backend.dto.AuthDTO;
//import lk.ijse.gdse72.backend.dto.AuthResponseDTO;
//import lk.ijse.gdse72.backend.dto.RegisterDTO;
//import lk.ijse.gdse72.backend.service.AuthServise;
//import lk.ijse.gdse72.backend.util.JwtUtil;
//import lombok.RequiredArgsConstructor;
//import org.springframework.dao.DataIntegrityViolationException;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.validation.BindingResult;
//import org.springframework.validation.FieldError;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.HashMap;
//import java.util.Map;
//
//@RestController
//@RequestMapping("api/auth")
//@RequiredArgsConstructor
//@CrossOrigin
//public class AuthController {
//
//    private final AuthServise authService;
//    private final JwtUtil jwtUtil;
//
//    @PostMapping("/register")
//    public ResponseEntity<ApiResponse> registerUser(@Valid @RequestBody RegisterDTO registerDTO,
//                                                    BindingResult bindingResult) {
//        if (bindingResult.hasErrors()) {
//            Map<String, String> errors = new HashMap<>();
//            bindingResult.getAllErrors().forEach(error -> {
//                if (error instanceof FieldError) {
//                    FieldError fieldError = (FieldError) error;
//                    errors.put(fieldError.getField(), fieldError.getDefaultMessage());
//                } else {
//                    errors.put(error.getObjectName(), error.getDefaultMessage());
//                }
//            });
//            return ResponseEntity.badRequest()
//                    .body(new ApiResponse(400, "Validation Error", errors));
//        }
//
//        try {
//            return ResponseEntity.ok(new ApiResponse(
//                    200,
//                    "User registered successfully",
//                    authService.register(registerDTO)
//            ));
//        } catch (DataIntegrityViolationException e) {
//            return ResponseEntity.badRequest()
//                    .body(new ApiResponse(400, "Database Error", e.getMostSpecificCause().getMessage()));
//        } catch (Exception e) {
//            return ResponseEntity.internalServerError()
//                    .body(new ApiResponse(500, "Server Error", e.getMessage()));
//        }
//    }
//
//    @PostMapping("/login")
//    public ResponseEntity<ApiResponse> loginUser(@Valid @RequestBody AuthDTO authDTO,
//                                                 HttpServletResponse response) {
//        try {
//            AuthResponseDTO authResponse = authService.authenticate(authDTO);
//
//            // Set token as HTTP-only cookie
//            Cookie tokenCookie = new Cookie("accessToken", authResponse.getAccessToken());
//            tokenCookie.setHttpOnly(true);
//            tokenCookie.setSecure(false); // Set to true in production with HTTPS
//            tokenCookie.setPath("/");
//            tokenCookie.setMaxAge(24 * 60 * 60); // 24 hours
//            response.addCookie(tokenCookie);
//
//            // Also return token in response for frontend storage if needed
//            Map<String, Object> responseData = new HashMap<>();
//            responseData.put("message", "Login successful");
//            responseData.put("token", authResponse.getAccessToken());
//            responseData.put("username", authDTO.getUserName());
//
//            return ResponseEntity.ok(new ApiResponse(200, "Login Successful", responseData));
//
//        } catch (Exception e) {
//            return ResponseEntity.badRequest()
//                    .body(new ApiResponse(400, "Login Failed", e.getMessage()));
//        }
//    }
//
//    @PostMapping("/logout")
//    public ResponseEntity<ApiResponse> logout(HttpServletRequest request, HttpServletResponse response) {
//        try {
//            // Clear the cookie
//            Cookie tokenCookie = new Cookie("accessToken", null);
//            tokenCookie.setHttpOnly(true);
//            tokenCookie.setSecure(false);
//            tokenCookie.setPath("/");
//            tokenCookie.setMaxAge(0);
//            response.addCookie(tokenCookie);
//
//            // Clear security context
//            SecurityContextHolder.clearContext();
//
//            return ResponseEntity.ok(new ApiResponse(200, "Logout Successful", "User logged out successfully"));
//
//        } catch (Exception e) {
//            return ResponseEntity.internalServerError()
//                    .body(new ApiResponse(500, "Logout Failed", e.getMessage()));
//        }
//    }
//
//    @GetMapping("/verify")
//    public ResponseEntity<ApiResponse> verifyToken(HttpServletRequest request) {
//        try {
//            String token = extractTokenFromRequest(request);
//
//            if (token != null && jwtUtil.validateToken(token)) {
//                String username = jwtUtil.extractUsername(token);
//                String role = jwtUtil.extractRole(token);
//                Boolean isAdmin = jwtUtil.extractIsAdmin(token);
//                long remainingTime = jwtUtil.getTokenRemainingTime(token);
//
//                Map<String, Object> responseData = new HashMap<>();
//                responseData.put("valid", true);
//                responseData.put("username", username);
//                responseData.put("role", role);
//                responseData.put("isAdmin", isAdmin);
//                responseData.put("remainingTime", remainingTime);
//
//                return ResponseEntity.ok(new ApiResponse(200, "Token Valid", responseData));
//            } else {
//                return ResponseEntity.badRequest()
//                        .body(new ApiResponse(401, "Invalid Token", "Token is invalid or expired"));
//            }
//
//        } catch (Exception e) {
//            return ResponseEntity.badRequest()
//                    .body(new ApiResponse(401, "Token Verification Failed", e.getMessage()));
//        }
//    }
//
//    @PostMapping("/refresh")
//    public ResponseEntity<ApiResponse> refreshToken(HttpServletRequest request, HttpServletResponse response) {
//        try {
//            String oldToken = extractTokenFromRequest(request);
//
//            if (oldToken != null && jwtUtil.validateToken(oldToken)) {
//                String username = jwtUtil.extractUsername(oldToken);
//                String role = jwtUtil.extractRole(oldToken);
//                Boolean isAdmin = jwtUtil.extractIsAdmin(oldToken);
//
//                // Generate new token
//                String newToken = jwtUtil.generateTokenWithClaims(username, role, isAdmin);
//
//                // Set new token as cookie
//                Cookie tokenCookie = new Cookie("accessToken", newToken);
//                tokenCookie.setHttpOnly(true);
//                tokenCookie.setSecure(false);
//                tokenCookie.setPath("/");
//                tokenCookie.setMaxAge(24 * 60 * 60);
//                response.addCookie(tokenCookie);
//
//                Map<String, Object> responseData = new HashMap<>();
//                responseData.put("message", "Token refreshed successfully");
//                responseData.put("token", newToken);
//
//                return ResponseEntity.ok(new ApiResponse(200, "Token Refreshed", responseData));
//            } else {
//                return ResponseEntity.badRequest()
//                        .body(new ApiResponse(401, "Invalid Token", "Cannot refresh invalid token"));
//            }
//
//        } catch (Exception e) {
//            return ResponseEntity.badRequest()
//                    .body(new ApiResponse(401, "Token Refresh Failed", e.getMessage()));
//        }
//    }
//
//    private String extractTokenFromRequest(HttpServletRequest request) {
//        // First try to get from Authorization header
//        String authHeader = request.getHeader("Authorization");
//        if (authHeader != null && authHeader.startsWith("Bearer ")) {
//            return authHeader.substring(7);
//        }
//
//        // Then try to get from cookie
//        Cookie[] cookies = request.getCookies();
//        if (cookies != null) {
//            for (Cookie cookie : cookies) {
//                if ("accessToken".equals(cookie.getName())) {
//                    return cookie.getValue();
//                }
//            }
//        }
//
//        return null;
//    }
//}