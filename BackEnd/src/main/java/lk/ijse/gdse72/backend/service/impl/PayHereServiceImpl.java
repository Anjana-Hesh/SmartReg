package lk.ijse.gdse72.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lk.ijse.gdse72.backend.dto.PayHereCallbackDTO;
import lk.ijse.gdse72.backend.dto.PaymentRequestDTO;
import lk.ijse.gdse72.backend.dto.PaymentResponseDTO;
import lk.ijse.gdse72.backend.dto.PaymentStatusDTO;
import lk.ijse.gdse72.backend.entity.Payment;
import lk.ijse.gdse72.backend.entity.PaymentMethod;
import lk.ijse.gdse72.backend.entity.PaymentStatus;
import lk.ijse.gdse72.backend.exception.GlobelExceptionHandler;
import lk.ijse.gdse72.backend.repository.PaymentRepository;
import lk.ijse.gdse72.backend.service.PayHereService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class PayHereServiceImpl implements PayHereService {


    private final PaymentRepository paymentRepository;

    @Value("${payhere.merchant-id}")
    private String merchantId;

    @Value("${payhere.merchant-secret}")
    private String merchantSecret;

    @Value("${payhere.base-url}")
    private String payhereBaseUrl;

    @Value("${app.base-url}")
    private String appBaseUrl;

    @Override
    public PaymentResponseDTO initializePayment(PaymentRequestDTO requestDTO) {
        log.info("Initializing payment for application: {}", requestDTO.getApplicationId());

        try {
            // Validate merchant configuration first
            validateMerchantConfiguration();

            // Validate required fields
            validatePaymentRequest(requestDTO);

            // Handle payment method validation
            PaymentMethod paymentMethod;
            try {
                paymentMethod = PaymentMethod.valueOf(requestDTO.getPaymentMethod().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid payment method: " + requestDTO.getPaymentMethod());
            }

            // Calculate exam fee
            String licenseType = requestDTO.getLicenseType() != null ? requestDTO.getLicenseType() : "";
            String vehicleClasses = requestDTO.getVehicleClasses() != null ? requestDTO.getVehicleClasses() : "";
            BigDecimal amount = calculateExamFee(licenseType, vehicleClasses);

            // Generate unique transaction ID with better format
            String transactionId = generateTransactionId();
            String payhereOrderId = "LP_" + System.currentTimeMillis(); // Changed prefix

            // Create payment record
            Payment.PaymentBuilder paymentBuilder = Payment.builder()
                    .transactionId(transactionId)
                    .applicationId(requestDTO.getApplicationId())
                    .driverId(requestDTO.getDriverId())
                    .driverName(requestDTO.getDriverName())
                    .amount(amount)
                    .currency("LKR")
                    .paymentMethod(paymentMethod)
                    .status(PaymentStatus.PENDING)
                    .licenseType(licenseType)
                    .payhereOrderId(payhereOrderId)
                    .createdDate(LocalDateTime.now());

            if (requestDTO.getWrittenExamId() != null) {
                paymentBuilder.writtenExamId(requestDTO.getWrittenExamId());
            }

            Payment payment = paymentBuilder.build();
            payment = paymentRepository.save(payment);

            // Build PayHere parameters (not URL for now)
            Map<String, String> paymentParams = buildPayHereParameters(payment);

            return PaymentResponseDTO.builder()
                    .paymentId(payment.getId())
                    .transactionId(transactionId)
                    .payhereOrderId(payhereOrderId)
                    .checkoutUrl(payhereBaseUrl + "/pay/checkout")
                    .amount(amount)
                    .currency("LKR")
                    .status(PaymentStatus.PENDING)
                    .createdDate(payment.getCreatedDate())
                    .merchantId(merchantId)
                    .merchantSecret(merchantSecret) // Remove this in production
                    .returnUrl(appBaseUrl + "/payment/success")
                    .cancelUrl(appBaseUrl + "/payment/cancel")
                    .notifyUrl(appBaseUrl + "/api/payment/callback")
                    .build();

        } catch (IllegalArgumentException e) {
            log.warn("Validation error in payment initialization: {}", e.getMessage());
            throw new GlobelExceptionHandler.PaymentException("Validation error: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error initializing payment: ", e);
            throw new GlobelExceptionHandler.PaymentException("Failed to initialize payment: " + e.getMessage());
        }
    }

    private Map<String, String> buildPayHereParameters(Payment payment) {
        Map<String, String> params = new HashMap<>();

        // Format amount properly
        String formattedAmount = payment.getAmount().setScale(2, BigDecimal.ROUND_HALF_UP).toString();

        // Split name properly
        String[] nameParts = payment.getDriverName().trim().split("\\s+", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : "";

        // Basic parameters
        params.put("merchant_id", merchantId);
        params.put("return_url", appBaseUrl + "/payment/success");
        params.put("cancel_url", appBaseUrl + "/payment/cancel");
        params.put("notify_url", appBaseUrl + "/api/payment/callback");
        params.put("order_id", payment.getPayhereOrderId());
        params.put("items", "Driving License Exam Fee - " + payment.getLicenseType());
        params.put("currency", "LKR");
        params.put("amount", formattedAmount);

        // Customer details (required by PayHere)
        params.put("first_name", firstName);
        params.put("last_name", lastName);
        params.put("email", "customer@licensepro.lk"); // Default email
        params.put("phone", "0771234567"); // Default phone
        params.put("address", "Colombo");
        params.put("city", "Colombo");
        params.put("country", "Sri Lanka");

        // Custom parameters
        params.put("custom_1", payment.getTransactionId());
        params.put("custom_2", payment.getApplicationId().toString());

        // Generate hash
        String hashInput = merchantId + payment.getPayhereOrderId() +
                formattedAmount + "LKR" + merchantSecret;
        String hash = generateMD5Hash(hashInput).toUpperCase();
        params.put("hash", hash);

        // Debug logging
        log.info("=== PayHere Parameters ===");
        log.info("Merchant ID: {}", merchantId);
        log.info("Order ID: {}", payment.getPayhereOrderId());
        log.info("Amount: {}", formattedAmount);
        log.info("Hash Input: {}", hashInput);
        log.info("Generated Hash: {}", hash);
        log.info("========================");

        return params;
    }

    // Validation method for payment requests
    private void validatePaymentRequest(PaymentRequestDTO requestDTO) {
        List<String> errors = new ArrayList<>();

        if (requestDTO.getApplicationId() == null) {
            errors.add("Application ID is required");
        }
        if (requestDTO.getDriverId() == null || requestDTO.getDriverId().trim().isEmpty()) {
            errors.add("Driver ID is required");
        }
        if (requestDTO.getDriverName() == null || requestDTO.getDriverName().trim().isEmpty()) {
            errors.add("Driver name is required");
        }
        if (requestDTO.getPaymentMethod() == null || requestDTO.getPaymentMethod().trim().isEmpty()) {
            errors.add("Payment method is required");
        }

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException(String.join(", ", errors));
        }
    }

    public String generatePayHereForm(String transactionId) {
        Optional<Payment> paymentOpt = paymentRepository.findByTransactionId(transactionId);
        if (!paymentOpt.isPresent()) {
            throw new GlobelExceptionHandler.PaymentNotFoundException("Payment not found");
        }

        Payment payment = paymentOpt.get();
        Map<String, String> params = buildPayHereParameters(payment);

        StringBuilder formHtml = new StringBuilder();
        formHtml.append("<form method='post' action='").append(payhereBaseUrl).append("/pay/checkout' id='payhere-form'>\n");

        for (Map.Entry<String, String> entry : params.entrySet()) {
            formHtml.append("  <input type='hidden' name='").append(entry.getKey())
                    .append("' value='").append(entry.getValue()).append("'>\n");
        }

        formHtml.append("  <input type='submit' value='Pay Now' class='btn btn-primary'>\n");
        formHtml.append("</form>\n");
        formHtml.append("<script>document.getElementById('payhere-form').submit();</script>");

        return formHtml.toString();
    }

    @Override
    public void handlePayHereCallback(PayHereCallbackDTO callbackDTO) {
        log.info("Processing PayHere callback for order: {}", callbackDTO.getOrder_id());

        try {
            // Verify signature first
            if (!verifyPayHereSignature(callbackDTO)) {
                log.warn("Invalid PayHere signature for order: {}", callbackDTO.getOrder_id());
                throw new GlobelExceptionHandler.PaymentException("Invalid payment signature");
            }

            // Find payment by PayHere order ID
            Optional<Payment> paymentOpt = paymentRepository.findByPayhereOrderId(callbackDTO.getOrder_id());
            if (!paymentOpt.isPresent()) {
                log.warn("Payment not found for PayHere order: {}", callbackDTO.getOrder_id());
                return;
            }

            Payment payment = paymentOpt.get();

            // Update payment based on status
            PaymentStatus newStatus;
            switch (callbackDTO.getStatus_code()) {
                case "2":
                    newStatus = PaymentStatus.COMPLETED;
                    payment.setPaymentDate(LocalDateTime.now());
                    break;
                case "0":
                    newStatus = PaymentStatus.PENDING;
                    break;
                case "-1":
                    newStatus = PaymentStatus.CANCELLED;
                    break;
                case "-2":
                    newStatus = PaymentStatus.FAILED;
                    payment.setFailureReason(callbackDTO.getStatus_message());
                    break;
                case "-3":
                    newStatus = PaymentStatus.PROCESSING;
                    break;
                default:
                    newStatus = PaymentStatus.FAILED;
                    payment.setFailureReason("Unknown status code: " + callbackDTO.getStatus_code());
            }

            payment.setStatus(newStatus);
            payment.setPayherePaymentId(callbackDTO.getPayment_id());
            payment.setPayhereResponse(objectToJson(callbackDTO));
            payment.setUpdatedDate(LocalDateTime.now());

            paymentRepository.save(payment);

            log.info("Payment status updated to {} for transaction: {}", newStatus, payment.getTransactionId());

            // Send notification or trigger additional processes
            if (newStatus == PaymentStatus.COMPLETED) {
                processSuccessfulPayment(payment);
            }

        } catch (Exception e) {
            log.error("Error processing PayHere callback: ", e);
            throw new GlobelExceptionHandler.PaymentException("Failed to process payment callback");
        }
    }

    @Override
    public PaymentStatusDTO getPaymentStatus(String transactionId) {
        Optional<Payment> paymentOpt = paymentRepository.findByTransactionId(transactionId);
        if (!paymentOpt.isPresent()) {
            throw new GlobelExceptionHandler.PaymentNotFoundException("Payment not found for transaction: " + transactionId);
        }

        Payment payment = paymentOpt.get();
        return PaymentStatusDTO.builder()
                .transactionId(payment.getTransactionId())
                .status(payment.getStatus())
                .statusMessage(payment.getStatus().getDescription())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod().getDisplayName())
                .paymentDate(payment.getPaymentDate())
                .receiptUrl("/api/payment/receipt/" + transactionId)
                .build();
    }

    @Override
    public List<PaymentStatusDTO> getDriverPaymentHistory(String driverId) {
        List<Payment> payments = paymentRepository.findByDriverIdOrderByCreatedDateDesc(driverId);
        return payments.stream()
                .map(this::convertToStatusDTO)
                .collect(Collectors.toList());
    }

    @Override
    public boolean verifyPayHereSignature(PayHereCallbackDTO callbackDTO) {
        try {
            String hashString = merchantId + callbackDTO.getOrder_id() +
                    callbackDTO.getPayhere_amount() + callbackDTO.getPayhere_currency() +
                    callbackDTO.getStatus_code() + merchantSecret;

            String expectedSignature = generateMD5Hash(hashString).toUpperCase();

            log.info("=== Signature Verification Debug ===");
            log.info("Hash String: {}", hashString);
            log.info("Expected Signature: {}", expectedSignature);
            log.info("Received Signature: {}", callbackDTO.getMd5sig());
            log.info("Signatures Match: {}", expectedSignature.equals(callbackDTO.getMd5sig()));
            log.info("===================================");

            return expectedSignature.equals(callbackDTO.getMd5sig());
        } catch (Exception e) {
            log.error("Error verifying PayHere signature: ", e);
            return false;
        }
    }

    @Override
    public BigDecimal calculateExamFee(String licenseType, String vehicleClasses) {
        BigDecimal baseFee = new BigDecimal("3000.00");

        if (licenseType != null) {
            switch (licenseType.toLowerCase()) {
                case "learner":
                    baseFee = new BigDecimal("2500.00");
                    break;
                case "restricted":
                    baseFee = new BigDecimal("3000.00");
                    break;
                case "full":
                    baseFee = new BigDecimal("4000.00");
                    break;
                case "heavy":
                    baseFee = new BigDecimal("6000.00");
                    break;
                case "commercial":
                    baseFee = new BigDecimal("7500.00");
                    break;
                case "international":
                    baseFee = new BigDecimal("5000.00");
                    break;
                case "motorcycle":
                    baseFee = new BigDecimal("3500.00");
                    break;
                case "special":
                    baseFee = new BigDecimal("8000.00");
                    break;
            }
        }

        // Additional fee for multiple vehicle classes
        if (vehicleClasses != null && !vehicleClasses.trim().isEmpty()) {
            int classCount = vehicleClasses.split(",").length;
            if (classCount > 1) {
                BigDecimal additionalFee = new BigDecimal("500.00").multiply(new BigDecimal(classCount - 1));
                baseFee = baseFee.add(additionalFee);
            }
        }

        return baseFee;
    }

    @Override
    public boolean isApplicationPaid(Long applicationId) {
        return paymentRepository.findCompletedPaymentByApplicationId(applicationId).isPresent();
    }

    @Override
    public String generatePaymentReceipt(String transactionId) {
        Optional<Payment> paymentOpt = paymentRepository.findByTransactionId(transactionId);
        if (!paymentOpt.isPresent() || paymentOpt.get().getStatus() != PaymentStatus.COMPLETED) {
            throw new GlobelExceptionHandler.PaymentException("No completed payment found for transaction: " + transactionId);
        }

        Payment payment = paymentOpt.get();

        return String.format(
                "LICENSEPRO - PAYMENT RECEIPT\n" +
                        "====================================\n\n" +
                        "Transaction Details:\n" +
                        "- Transaction ID: %s\n" +
                        "- Date & Time: %s\n" +
                        "- Status: %s\n\n" +
                        "Application Details:\n" +
                        "- Application ID: #%d\n" +
                        "- License Type: %s\n" +
                        "- Driver Name: %s\n" +
                        "- Driver ID: %s\n\n" +
                        "Payment Details:\n" +
                        "- Amount Paid: Rs. %s\n" +
                        "- Payment Method: %s\n" +
                        "- Currency: %s\n\n" +
                        "Important Notes:\n" +
                        "- Keep this receipt for your records\n" +
                        "- Present this receipt during your exam\n" +
                        "- Contact support if you have any questions\n\n" +
                        "Thank you for using LicensePro!\n" +
                        "Support: support@licensepro.lk",
                payment.getTransactionId(),
                payment.getPaymentDate() != null ? payment.getPaymentDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "N/A",
                payment.getStatus().getDescription(),
                payment.getApplicationId(),
                payment.getLicenseType() != null ? payment.getLicenseType().toUpperCase() : "N/A",
                payment.getDriverName(),
                payment.getDriverId(),
                payment.getAmount().toString(),
                payment.getPaymentMethod().getDisplayName(),
                payment.getCurrency()
        );
    }

    // Helper methods
    private String generateTransactionId() {
        return "TXN" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private void debugPayHereParameters(Payment payment, String hash) {
        log.info("=== PayHere Debug Information ===");
        log.info("Merchant ID: {}", merchantId);
        log.info("Order ID: {}", payment.getPayhereOrderId());
        log.info("Amount: {}", payment.getAmount().toString());
        log.info("Currency: {}", payment.getCurrency());
        log.info("Generated Hash: {}", hash);

        // Log the string used for hash generation
        String hashString = merchantId + payment.getPayhereOrderId() +
                payment.getAmount().toString() + payment.getCurrency() + merchantSecret;
        log.info("Hash String: {}", hashString);
        log.info("================================");
    }

    // Updated buildPayHereCheckoutUrl method with better error handling and debugging
    private String buildPayHereCheckoutUrl(Payment payment) {
        try {
            String baseUrl = payhereBaseUrl + "/pay/checkout";
            Map<String, String> params = new HashMap<>();

            // Ensure amount has proper decimal format
            String formattedAmount = payment.getAmount().setScale(2, BigDecimal.ROUND_HALF_UP).toString();

            params.put("merchant_id", merchantId);
            params.put("return_url", appBaseUrl + "/payment/success");
            params.put("cancel_url", appBaseUrl + "/payment/cancel");
            params.put("notify_url", appBaseUrl + "/api/payment/callback");
            params.put("order_id", payment.getPayhereOrderId());
            params.put("items", "Driving License Exam Fee");
            params.put("currency", payment.getCurrency());
            params.put("amount", formattedAmount);

            // Handle name splitting more safely
            String[] nameParts = payment.getDriverName().trim().split("\\s+");
            params.put("first_name", nameParts[0]);
            params.put("last_name", nameParts.length > 1 ?
                    String.join(" ", Arrays.copyOfRange(nameParts, 1, nameParts.length)) : "");

            // Provide default values for required fields
            params.put("email", "customer@example.com"); // PayHere might require this
            params.put("phone", "0771234567"); // PayHere might require this
            params.put("address", "N/A");
            params.put("city", "Colombo");
            params.put("country", "Sri Lanka");
            params.put("custom_1", payment.getTransactionId());
            params.put("custom_2", payment.getApplicationId().toString());

            // Generate hash with formatted amount
            String hashString = merchantId + payment.getPayhereOrderId() +
                    formattedAmount + payment.getCurrency() + merchantSecret;
            String hash = generateMD5Hash(hashString).toUpperCase();
            params.put("hash", hash);

            // Debug logging
            debugPayHereParameters(payment, hash);

            // Build URL with parameters
            StringBuilder urlBuilder = new StringBuilder(baseUrl + "?");
            for (Map.Entry<String, String> entry : params.entrySet()) {
                urlBuilder.append(entry.getKey()).append("=")
                        .append(URLEncoder.encode(entry.getValue(), "UTF-8")).append("&");
            }

            String finalUrl = urlBuilder.toString().replaceAll("&$", "");
            log.info("Final PayHere URL: {}", finalUrl);
            return finalUrl;

        } catch (Exception e) {
            log.error("Error building PayHere URL: ", e);
            throw new GlobelExceptionHandler.PaymentException("Failed to build PayHere checkout URL: " + e.getMessage());
        }
    }

    private void processSuccessfulPayment(Payment payment) {
        // Add any additional processing for successful payments
        // e.g., send confirmation emails, update application status, etc.
        log.info("Processing successful payment for application: {}", payment.getApplicationId());
    }

    private PaymentStatusDTO convertToStatusDTO(Payment payment) {
        return PaymentStatusDTO.builder()
                .transactionId(payment.getTransactionId())
                .status(payment.getStatus())
                .statusMessage(payment.getStatus().getDescription())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod().getDisplayName())
                .paymentDate(payment.getPaymentDate())
                .receiptUrl("/api/payment/receipt/" + payment.getTransactionId())
                .build();
    }

    private String generateMD5Hash(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(input.getBytes("UTF-8"));
            StringBuilder hexString = new StringBuilder();

            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }

            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate MD5 hash", e);
        }
    }

    private String objectToJson(Object obj) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            return obj.toString();
        }
    }

    private void validatePayHereParameters(Payment payment) {
        List<String> errors = new ArrayList<>();

        if (merchantId == null || merchantId.trim().isEmpty()) {
            errors.add("Merchant ID is not configured");
        }

        if (merchantSecret == null || merchantSecret.trim().isEmpty()) {
            errors.add("Merchant secret is not configured");
        }

        if (payment.getAmount() == null || payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            errors.add("Invalid payment amount");
        }

        if (payment.getPayhereOrderId() == null || payment.getPayhereOrderId().trim().isEmpty()) {
            errors.add("Order ID is missing");
        }

        if (payment.getDriverName() == null || payment.getDriverName().trim().isEmpty()) {
            errors.add("Customer name is missing");
        }

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException("PayHere validation errors: " + String.join(", ", errors));
        }
    }

    private void validateMerchantConfiguration() {
        List<String> issues = new ArrayList<>();

        // Check merchant ID format
        if (merchantId == null || merchantId.trim().isEmpty()) {
            issues.add("Merchant ID is missing");
        } else if (!merchantId.matches("\\d+")) {
            issues.add("Merchant ID should contain only digits");
        }

        // Check merchant secret
        if (merchantSecret == null || merchantSecret.trim().isEmpty()) {
            issues.add("Merchant Secret is missing");
        } else if (merchantSecret.length() < 32) {
            issues.add("Merchant Secret seems too short");
        }

        // Check URLs
        if (appBaseUrl == null || !appBaseUrl.startsWith("http")) {
            issues.add("Invalid app base URL");
        }

        if (payhereBaseUrl == null || !payhereBaseUrl.startsWith("https://")) {
            issues.add("Invalid PayHere base URL");
        }

        if (!issues.isEmpty()) {
            throw new IllegalStateException("Merchant configuration issues: " + String.join(", ", issues));
        }
    }

}
