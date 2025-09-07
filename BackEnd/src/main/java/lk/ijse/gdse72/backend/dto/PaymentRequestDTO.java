package lk.ijse.gdse72.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRequestDTO {
    @NotNull(message = "Application ID is required")
    private Long applicationId;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    @NotBlank(message = "Driver ID is required")
    private String driverId;

    @NotBlank(message = "Driver name is required")
    private String driverName;

    private Long writtenExamId;

    // Optional fields for validation
    private String licenseType;
    private String vehicleClasses;
}
