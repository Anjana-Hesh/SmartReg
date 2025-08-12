package lk.ijse.gdse72.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Future;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class WrittenExamRequestDto {

    @NotNull(message = "Application ID is required")
    private Long applicationId;

    @NotNull(message = "Exam date is required")
    @Future(message = "Exam date must be in the future")
    private LocalDate writtenExamDate;

    @NotNull(message = "Exam time is required")
    private LocalTime writtenExamTime;

    private String writtenExamLocation;

    private String note;

    private String writtenExamResult; // Optional for initial scheduling
}

//  For request data with validation annotations