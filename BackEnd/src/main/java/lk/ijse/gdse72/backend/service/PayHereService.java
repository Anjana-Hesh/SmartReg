package lk.ijse.gdse72.backend.service;

import lk.ijse.gdse72.backend.dto.PayHereCallbackDTO;
import lk.ijse.gdse72.backend.dto.PaymentRequestDTO;
import lk.ijse.gdse72.backend.dto.PaymentResponseDTO;
import lk.ijse.gdse72.backend.dto.PaymentStatusDTO;

import java.math.BigDecimal;
import java.util.List;

public interface PayHereService {

    PaymentResponseDTO initializePayment(PaymentRequestDTO requestDTO);

    void handlePayHereCallback(PayHereCallbackDTO callbackDTO);

    PaymentStatusDTO getPaymentStatus(String transactionId);

    List<PaymentStatusDTO> getDriverPaymentHistory(String driverId);

    boolean verifyPayHereSignature(PayHereCallbackDTO callbackDTO);

    BigDecimal calculateExamFee(String licenseType, String vehicleClasses);

    boolean isApplicationPaid(Long applicationId);

    String generatePaymentReceipt(String transactionId);
}
