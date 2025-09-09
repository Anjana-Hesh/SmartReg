package lk.ijse.gdse72.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LicenseDTO {

    private Long id;
    private String licenseNumber;
    private LocalDate issueDate;
    private LocalDate expireDate;
    private Long trialExamId;

    // Additional fields for response purposes
    private String driverName;
    private String nicNumber;
    private String licenseType;
    private String vehicleClasses;
}