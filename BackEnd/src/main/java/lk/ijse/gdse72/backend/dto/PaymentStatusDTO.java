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
public class PaymentStatusDTO {
    private String transactionId;
    private PaymentStatus status;
    private String statusMessage;
    private BigDecimal amount;
    private String paymentMethod;
    private LocalDateTime paymentDate;
    private String receiptUrl;
}
