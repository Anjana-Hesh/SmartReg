package lk.ijse.gdse72.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

public class ApplicationDTO {
    private Long id;
    private String driverId;
    private String licenseType;
    private String examLanguage;
    private List<String> vehicleClasses;
    private String nicNumber;
    private String bloodGroup;
    private String dateOfBirth;
    private String phoneNumber;
    private String address;
    private String photoPath;
    private String medicalCertificatePath;
    private String status; // PENDING, APPROVED, REJECTED, PAYMENT_PENDING, COMPLETED

}
