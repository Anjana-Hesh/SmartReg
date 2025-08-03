package lk.ijse.gdse72.backend.controller;
//
//import lk.ijse.gdse72.backend.dto.ApiResponse;
//import lk.ijse.gdse72.backend.dto.AuthDTO;
//import lk.ijse.gdse72.backend.dto.RegisterDTO;
//import lk.ijse.gdse72.backend.service.AuthServise;
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequestMapping("/auth")
//@RequiredArgsConstructor
//@CrossOrigin
//
//public class AuthController {
//
//    private final AuthServise authService;
//
//    @PostMapping("/register")
//    public ResponseEntity<ApiResponse> registerUser(@RequestBody RegisterDTO registerDTO){
//        return ResponseEntity.ok(new ApiResponse(
//                200,
//                "OK",
//                authService.register(registerDTO)
//
//        ));
//    }
//
//    @PostMapping("/login")
//    public ResponseEntity<ApiResponse> loginUser(@RequestBody AuthDTO authDTO) {
//        return ResponseEntity.ok(new ApiResponse(
//                200,
//                "OK",
//                authService.authenticate(authDTO)
//        ));
//    }
//
//}


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
@RequestMapping("/auth")
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