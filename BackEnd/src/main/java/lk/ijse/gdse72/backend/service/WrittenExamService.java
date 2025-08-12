package lk.ijse.gdse72.backend.service;

import lk.ijse.gdse72.backend.dto.WrittenExamDto;
import lk.ijse.gdse72.backend.dto.WrittenExamRequestDto;

import java.util.List;
import java.util.Optional;

public interface WrittenExamService {

    /**
     * Schedule a written exam for an application
     */
    WrittenExamDto scheduleWrittenExam(WrittenExamRequestDto requestDto);

    /**
     * Get written exam by ID
     */
    Optional<WrittenExamDto> getWrittenExamById(Long examId);

    /**
     * Get written exam by application ID
     */
    Optional<WrittenExamDto> getWrittenExamByApplicationId(Long applicationId);

    /**
     * Get all written exams
     */
    List<WrittenExamDto> getAllWrittenExams();

    /**
     * Update written exam details
     */
    WrittenExamDto updateWrittenExam(Long examId, WrittenExamRequestDto requestDto);

    /**
     * Update written exam result
     */
    WrittenExamDto updateExamResult(Long examId, String result, String note);

    /**
     * Delete written exam
     */
    void deleteWrittenExam(Long examId);

    /**
     * Get written exams by result
     */
    List<WrittenExamDto> getWrittenExamsByResult(String result);

    /**
     * Check if written exam exists for application
     */
    boolean existsByApplicationId(Long applicationId);
}