package lk.ijse.gdse72.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WrittenExamResultUpdateDTO {
    private String result;
    private String note;
    private LocalDate nextExamDate;
    private LocalDate trialDate;
}