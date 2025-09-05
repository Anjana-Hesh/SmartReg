package lk.ijse.gdse72.backend.service.impl;

import lk.ijse.gdse72.backend.dto.ExamScheduleDTO;
import lk.ijse.gdse72.backend.entity.ExamSchedule;
import lk.ijse.gdse72.backend.entity.WrittenExam;
import lk.ijse.gdse72.backend.repository.ExamScheduleRepository;
import lk.ijse.gdse72.backend.repository.WrittenExamRepository;
import lk.ijse.gdse72.backend.service.ExamScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ExamScheduleServiceImpl implements ExamScheduleService {

    private final ExamScheduleRepository examScheduleRepository;
    private final WrittenExamRepository writtenExamRepository;

    @Override
    public ExamScheduleDTO createExamSchedule(ExamScheduleDTO examScheduleDTO) {
        log.info("Creating exam schedule for written exam ID: {}", examScheduleDTO.getWrittenExamId());

        // Validate written exam exists
        WrittenExam writtenExam = writtenExamRepository.findById(examScheduleDTO.getWrittenExamId())
                .orElseThrow(() -> new RuntimeException("Written exam not found with ID: " + examScheduleDTO.getWrittenExamId()));

        // Check if schedule already exists
        if (examScheduleRepository.existsByWrittenExamId(examScheduleDTO.getWrittenExamId())) {
            throw new RuntimeException("Exam schedule already exists for written exam ID: " + examScheduleDTO.getWrittenExamId());
        }

        ExamSchedule examSchedule = ExamSchedule.builder()
                .trialDate(examScheduleDTO.getTrialDate())
                .nextExamDate(examScheduleDTO.getNextExamDate())
                .writtenExam(writtenExam)
                .build();

        ExamSchedule savedSchedule = examScheduleRepository.save(examSchedule);
        log.info("Exam schedule created successfully with ID: {}", savedSchedule.getId());

        return convertToDTO(savedSchedule);
    }

    @Override
    public ExamScheduleDTO updateExamSchedule(ExamScheduleDTO examScheduleDTO) {
        log.info("Updating exam schedule with ID: {}", examScheduleDTO.getId());

        ExamSchedule examSchedule = examScheduleRepository.findById(examScheduleDTO.getId())
                .orElseThrow(() -> new RuntimeException("Exam schedule not found with ID: " + examScheduleDTO.getId()));

        examSchedule.setTrialDate(examScheduleDTO.getTrialDate());
        examSchedule.setNextExamDate(examScheduleDTO.getNextExamDate());

        ExamSchedule updatedSchedule = examScheduleRepository.save(examSchedule);
        log.info("Exam schedule updated successfully with ID: {}", updatedSchedule.getId());

        return convertToDTO(updatedSchedule);
    }

    @Override
    @Transactional(readOnly = true)
    public ExamScheduleDTO getExamScheduleByWrittenExamId(Long writtenExamId) {
        log.info("Fetching exam schedule for written exam ID: {}", writtenExamId);

        Optional<ExamSchedule> examSchedule = examScheduleRepository.findByWrittenExamId(writtenExamId);
        return examSchedule.map(this::convertToDTO).orElse(null);
    }

    @Override
    public void deleteExamSchedule(Long id) {
        log.info("Deleting exam schedule with ID: {}", id);

        if (!examScheduleRepository.existsById(id)) {
            throw new RuntimeException("Exam schedule not found with ID: " + id);
        }

        examScheduleRepository.deleteById(id);
        log.info("Exam schedule deleted successfully with ID: {}", id);
    }

    private ExamScheduleDTO convertToDTO(ExamSchedule examSchedule) {
        if (examSchedule == null) {
            return null;
        }

        return new ExamScheduleDTO(
                examSchedule.getId(),
                examSchedule.getTrialDate(),
                examSchedule.getNextExamDate(),
                examSchedule.getWrittenExam() != null ? examSchedule.getWrittenExam().getId() : null
        );
    }
}