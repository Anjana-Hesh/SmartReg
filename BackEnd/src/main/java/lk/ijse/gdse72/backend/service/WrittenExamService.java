package lk.ijse.gdse72.backend.service;

import lk.ijse.gdse72.backend.dto.WrittenExamDto;
import lk.ijse.gdse72.backend.dto.WrittenExamRequestDto;
import lk.ijse.gdse72.backend.entity.WrittenExam;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WrittenExamService {

    void updateExamResultWithDates(Long examId, String result, String note,
                                   LocalDate trialDate, LocalDate nextExamDate);
    WrittenExamDto scheduleWrittenExam(WrittenExamRequestDto requestDto);
    Optional<WrittenExamDto> getWrittenExamById(Long examId);
    Optional<WrittenExamDto> getWrittenExamByApplicationId(Long applicationId);
    List<WrittenExamDto> getAllWrittenExams();
    WrittenExamDto updateWrittenExam(Long examId, WrittenExamRequestDto requestDto);
    void updateExamResult(Long examId, String result, String note);    void deleteWrittenExam(Long examId);
    List<WrittenExamDto> getWrittenExamsByResult(String result);
    boolean existsByApplicationId(Long applicationId);

    WrittenExam updateWrittenExamResult(Long examId, String result, String note, LocalDate trialDate, LocalDate nextExamDate);
}