package lk.ijse.gdse72.backend.service;

import lk.ijse.gdse72.backend.dto.PayHereCallbackDTO;
import lk.ijse.gdse72.backend.dto.PaymentRequestDTO;
import lk.ijse.gdse72.backend.dto.PaymentResponseDTO;
import lk.ijse.gdse72.backend.dto.PaymentStatusDTO;

import java.math.BigDecimal;
import java.util.List;

public interface PayHereService {

    /**
     * Initialize payment with PayHere
     */
    PaymentResponseDTO initializePayment(PaymentRequestDTO requestDTO);

    /**
     * Handle PayHere callback/notification
     */
    void handlePayHereCallback(PayHereCallbackDTO callbackDTO);

    /**
     * Get payment status by transaction ID
     */
    PaymentStatusDTO getPaymentStatus(String transactionId);

    /**
     * Get driver's payment history
     */
    List<PaymentStatusDTO> getDriverPaymentHistory(String driverId);

    /**
     * Verify PayHere signature
     */
    boolean verifyPayHereSignature(PayHereCallbackDTO callbackDTO);

    /**
     * Calculate exam fee based on license type and vehicle classes
     */
    BigDecimal calculateExamFee(String licenseType, String vehicleClasses);

    /**
     * Check if application payment is completed
     */
    boolean isApplicationPaid(Long applicationId);

    /**
     * Generate payment receipt
     */
    String generatePaymentReceipt(String transactionId);
}
