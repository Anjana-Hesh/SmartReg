package lk.ijse.gdse72.backend.service;

import lk.ijse.gdse72.backend.dto.ExamScheduleDTO;

public interface ExamScheduleService {
    ExamScheduleDTO createExamSchedule(ExamScheduleDTO examScheduleDTO);
    ExamScheduleDTO updateExamSchedule(ExamScheduleDTO examScheduleDTO);
    ExamScheduleDTO getExamScheduleByWrittenExamId(Long writtenExamId);
    void deleteExamSchedule(Long id);
}