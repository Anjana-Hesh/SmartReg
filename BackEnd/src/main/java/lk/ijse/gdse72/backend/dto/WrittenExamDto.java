package lk.ijse.gdse72.backend.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class WrittenExamDto {

    private Long id;

    private LocalDate writtenExamDate;

    private LocalTime writtenExamTime;

    private String writtenExamLocation;

    private String note;

    private String writtenExamResult;

    private Long applicationId;

    // Optional: Include application details if needed
    private String driverName;

    private String licenseType;

    private String examLanguage;

    // Add these missing fields
    private LocalDate nextExamDate;
    private LocalDate trialDate;
}

// This DTO is used to transfer written exam data, including application details if needed.