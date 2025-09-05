package lk.ijse.gdse72.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrialExamDTO {
    private Long id;
    private Long writtenExamId;
    private LocalDate trialDate;
    private LocalTime trialTime;
    private String trialLocation;
    private String trialResult;
    private String examinerNotes;
}