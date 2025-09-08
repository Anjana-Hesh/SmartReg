package lk.ijse.gdse72.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lk.ijse.gdse72.backend.dto.*;
import lk.ijse.gdse72.backend.exception.GlobelExceptionHandler;
import lk.ijse.gdse72.backend.service.PayHereService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payment")
@CrossOrigin(origins = "*")
@Slf4j
@RequiredArgsConstructor
public class PaymentController {

    private final PayHereService payHereService;

    @PostMapping("/initialize")
    public ResponseEntity<ApiResponse> initializePayment(
            @Valid @RequestBody PaymentRequestDTO requestDTO) {
        try {
            log.info("Payment initialization request received: {}", requestDTO);

            // Add additional validation
            if (requestDTO.getApplicationId() == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(400, "Application ID is required", null));
            }

            if (requestDTO.getPaymentMethod() == null || requestDTO.getPaymentMethod().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(400, "Payment method is required", null));
            }

            PaymentResponseDTO response = payHereService.initializePayment(requestDTO);
            ApiResponse apiResponse = new ApiResponse(200, "success", response);
            return ResponseEntity.ok(apiResponse);
        } catch (IllegalArgumentException e) {
            log.warn("Validation error in payment initialization: {}", e.getMessage());
            ApiResponse apiResponse = new ApiResponse(400, "Validation error: " + e.getMessage(), null);
            return ResponseEntity.badRequest().body(apiResponse);
        } catch (Exception e) {
            log.error("Error initializing payment: ", e);
            ApiResponse apiResponse = new ApiResponse(500, "Failed to initialize payment: " + e.getMessage(), null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(apiResponse);
        }
    }

    @PostMapping("/callback")
    public ResponseEntity<String> handlePayHereCallback(
            @ModelAttribute PayHereCallbackDTO callbackDTO,
            HttpServletRequest request) {
        try {
            log.info("Received PayHere callback: {}", callbackDTO);

            // Log all request parameters for debugging
            request.getParameterMap().forEach((key, values) ->
                    log.info("Callback param: {} = {}", key, String.join(",", values)));

            payHereService.handlePayHereCallback(callbackDTO);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Error handling PayHere callback: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("ERROR");
        }
    }

    @GetMapping("/status/{transactionId}")
    public ResponseEntity<ApiResponse> getPaymentStatus(
            @PathVariable String transactionId) {
        try {
            PaymentStatusDTO status = payHereService.getPaymentStatus(transactionId);
            ApiResponse apiResponse = new ApiResponse(200, "success", status);
            return ResponseEntity.ok(apiResponse);
        } catch (GlobelExceptionHandler.PaymentNotFoundException e) {
            ApiResponse apiResponse = new ApiResponse(404, "Payment not found: " + e.getMessage(), null);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(apiResponse);
        } catch (Exception e) {
            log.error("Error getting payment status: ", e);
            ApiResponse apiResponse = new ApiResponse(500, "Failed to get payment status", null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(apiResponse);
        }
    }

    @GetMapping("/history/{driverId}")
    public ResponseEntity<ApiResponse> getPaymentHistory(
            @PathVariable String driverId) {
        try {
            List<PaymentStatusDTO> history = payHereService.getDriverPaymentHistory(driverId);
            ApiResponse apiResponse = new ApiResponse(200, "success", history);
            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Error getting payment history: ", e);
            ApiResponse apiResponse = new ApiResponse(500, "Failed to get payment history", null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(apiResponse);
        }
    }

    @GetMapping("/receipt/{transactionId}")
    public ResponseEntity<String> downloadReceipt(@PathVariable String transactionId) {
        try {
            String receipt = payHereService.generatePaymentReceipt(transactionId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            headers.setContentDispositionFormData("attachment",
                    "LicensePro_Receipt_" + transactionId + ".txt");

            return new ResponseEntity<>(receipt, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error generating receipt: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to generate receipt");
        }
    }

    @GetMapping("/calculate-fee")
    public ResponseEntity<ApiResponse> calculateExamFee(
            @RequestParam String licenseType,
            @RequestParam(required = false) String vehicleClasses) {
        try {
            BigDecimal fee = payHereService.calculateExamFee(licenseType, vehicleClasses);

            Map<String, Object> response = new HashMap<>();
            response.put("licenseType", licenseType);
            response.put("vehicleClasses", vehicleClasses);
            response.put("examFee", fee);
            response.put("currency", "LKR");

            ApiResponse apiResponse = new ApiResponse(200, "success", response);
            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Error calculating exam fee: ", e);
            ApiResponse apiResponse = new ApiResponse(500, "Failed to calculate exam fee", null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(apiResponse);
        }
    }

    @GetMapping("/check-payment/{applicationId}")
    public ResponseEntity<ApiResponse> checkApplicationPayment(
            @PathVariable Long applicationId) {
        try {
            boolean isPaid = payHereService.isApplicationPaid(applicationId);

            Map<String, Boolean> response = new HashMap<>();
            response.put("isPaid", isPaid);

            ApiResponse apiResponse = new ApiResponse(200, "success", response);
            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            log.error("Error checking application payment: ", e);
            ApiResponse apiResponse = new ApiResponse(500, "Failed to check payment status", null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(apiResponse);
        }
    }

//    @PostMapping("/initialize-js")
//    public ResponseEntity<ApiResponse> initializeJSPayment(
//            @Valid @RequestBody PaymentRequestDTO requestDTO) {
//        try {
//            PaymentResponseDTO response = payHereService.initializeJSPayment(requestDTO);
//            ApiResponse apiResponse = new ApiResponse(200, "success", response);
//            return ResponseEntity.ok(apiResponse);
//        } catch (Exception e) {
//            log.error("Error initializing JS payment: ", e);
//            ApiResponse apiResponse = new ApiResponse(500, "Failed to initialize payment", null);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(apiResponse);
//        }
//    }
}