package lk.ijse.gdse72.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExamScheduleDTO {
    private Long id;
    private LocalDate trialDate;
    private LocalDate nextExamDate;
    private Long writtenExamId;
}