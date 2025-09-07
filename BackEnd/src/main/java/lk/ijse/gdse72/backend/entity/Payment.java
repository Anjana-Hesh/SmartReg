package lk.ijse.gdse72.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_id", unique = true, nullable = false)
    private String transactionId;

    @Column(name = "payhere_payment_id")
    private String payherePaymentId;

    @Column(name = "application_id", nullable = false)
    private Long applicationId;

    @Column(name = "written_exam_id")
    private Long writtenExamId;

    @Column(name = "driver_id", nullable = false)
    private String driverId;

    @Column(name = "driver_name", nullable = false)
    private String driverName;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false)
    private String currency = "LKR";

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PaymentStatus status;

    @Column(name = "license_type")
    private String licenseType;

//    @Column(name = "vehicle_classes")
//    private String vehicleClasses;

    @Column(name = "payhere_order_id")
    private String payhereOrderId;

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "payhere_response", columnDefinition = "TEXT")
    private String payhereResponse;

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
        if (status == null) {
            status = PaymentStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedDate = LocalDateTime.now();
    }
}
