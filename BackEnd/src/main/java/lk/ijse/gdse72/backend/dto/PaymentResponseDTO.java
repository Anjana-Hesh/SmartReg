package lk.ijse.gdse72.backend.dto;

import lk.ijse.gdse72.backend.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponseDTO {
    private Long paymentId;
    private String transactionId;
    private String payhereOrderId;
    private String checkoutUrl;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private LocalDateTime createdDate;

    // PayHere specific fields for frontend
    private String merchantId;
    private String merchantSecret;
    private String returnUrl;
    private String cancelUrl;
    private String notifyUrl;
}