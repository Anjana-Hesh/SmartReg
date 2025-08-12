package lk.ijse.gdse72.backend.service.impl;

import lk.ijse.gdse72.backend.dto.WrittenExamDto;
import lk.ijse.gdse72.backend.dto.WrittenExamRequestDto;
import lk.ijse.gdse72.backend.entity.Application;
import lk.ijse.gdse72.backend.entity.WrittenExam;
import lk.ijse.gdse72.backend.repository.ApplicationRepository;
import lk.ijse.gdse72.backend.repository.WrittenExamRepository;
import lk.ijse.gdse72.backend.service.WrittenExamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WrittenExamServiceImpl implements WrittenExamService {

    private final WrittenExamRepository writtenExamRepository;
    private final ApplicationRepository applicationRepository;

    @Override
    public WrittenExamDto scheduleWrittenExam(WrittenExamRequestDto requestDto) {
        log.info("Scheduling written exam for application ID: {}", requestDto.getApplicationId());

        // Check if application exists
        Application application = applicationRepository.findById(requestDto.getApplicationId())
                .orElseThrow(() -> new RuntimeException("Application not found with ID: " + requestDto.getApplicationId()));

        // Check if exam already exists for this application
        if (writtenExamRepository.existsByApplicationId(requestDto.getApplicationId())) {
            throw new RuntimeException("Written exam already scheduled for this application");
        }

        // Create written exam entity
        WrittenExam writtenExam = WrittenExam.builder()
                .writtenExamDate(requestDto.getWrittenExamDate())
                .writtenExamTime(requestDto.getWrittenExamTime())
                .writtenExamLocation(requestDto.getWrittenExamLocation() != null ?
                        requestDto.getWrittenExamLocation() : "Colombo Department of Motor Traffic")
                .note(requestDto.getNote())
                .writtenExamResult(requestDto.getWrittenExamResult()) // Usually null when scheduling
                .application(application)
                .build();

        WrittenExam savedExam = writtenExamRepository.save(writtenExam);
        log.info("Written exam scheduled successfully with ID: {}", savedExam.getId());

        return convertToDto(savedExam);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<WrittenExamDto> getWrittenExamById(Long examId) {
        log.info("Fetching written exam with ID: {}", examId);
        return writtenExamRepository.findByIdWithApplication(examId)
                .map(this::convertToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<WrittenExamDto> getWrittenExamByApplicationId(Long applicationId) {
        log.info("Fetching written exam for application ID: {}", applicationId);
        return writtenExamRepository.findByApplicationId(applicationId)
                .map(this::convertToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WrittenExamDto> getAllWrittenExams() {
        log.info("Fetching all written exams");
        return writtenExamRepository.findAllWithApplication()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public WrittenExamDto updateWrittenExam(Long examId, WrittenExamRequestDto requestDto) {
        log.info("Updating written exam with ID: {}", examId);

        WrittenExam existingExam = writtenExamRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Written exam not found with ID: " + examId));

        // Update fields
        existingExam.setWrittenExamDate(requestDto.getWrittenExamDate());
        existingExam.setWrittenExamTime(requestDto.getWrittenExamTime());
        existingExam.setWrittenExamLocation(requestDto.getWrittenExamLocation());
        existingExam.setNote(requestDto.getNote());

        if (requestDto.getWrittenExamResult() != null) {
            existingExam.setWrittenExamResult(requestDto.getWrittenExamResult());
        }

        WrittenExam updatedExam = writtenExamRepository.save(existingExam);
        log.info("Written exam updated successfully with ID: {}", updatedExam.getId());

        return convertToDto(updatedExam);
    }

    @Override
    public WrittenExamDto updateExamResult(Long examId, String result, String note) {
        log.info("Updating exam result for written exam ID: {} with result: {}", examId, result);

        WrittenExam existingExam = writtenExamRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Written exam not found with ID: " + examId));

        existingExam.setWrittenExamResult(result);
        if (note != null && !note.trim().isEmpty()) {
            existingExam.setNote(existingExam.getNote() != null ?
                    existingExam.getNote() + "\n" + note : note);
        }

        WrittenExam updatedExam = writtenExamRepository.save(existingExam);
        log.info("Exam result updated successfully for ID: {}", updatedExam.getId());

        return convertToDto(updatedExam);
    }

    @Override
    public void deleteWrittenExam(Long examId) {
        log.info("Deleting written exam with ID: {}", examId);

        if (!writtenExamRepository.existsById(examId)) {
            throw new RuntimeException("Written exam not found with ID: " + examId);
        }

        writtenExamRepository.deleteById(examId);
        log.info("Written exam deleted successfully with ID: {}", examId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WrittenExamDto> getWrittenExamsByResult(String result) {
        log.info("Fetching written exams with result: {}", result);
        return writtenExamRepository.findByWrittenExamResult(result)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByApplicationId(Long applicationId) {
        return writtenExamRepository.existsByApplicationId(applicationId);
    }

    /**
     * Convert WrittenExam entity to DTO
     */
    private WrittenExamDto convertToDto(WrittenExam writtenExam) {
        WrittenExamDto.WrittenExamDtoBuilder builder = WrittenExamDto.builder()
                .id(writtenExam.getId())
                .writtenExamDate(writtenExam.getWrittenExamDate())
                .writtenExamTime(writtenExam.getWrittenExamTime())
                .writtenExamLocation(writtenExam.getWrittenExamLocation())
                .note(writtenExam.getNote())
                .writtenExamResult(writtenExam.getWrittenExamResult())
                .applicationId(writtenExam.getApplication().getId());

        // Add application details if available
        if (writtenExam.getApplication() != null) {
            Application app = writtenExam.getApplication();
            if (app.getDriver() != null) {
                String driverName = app.getDriver().getFullName();
                builder.driverName(driverName);
            }
            builder.licenseType(app.getLicenseType())
                    .examLanguage(app.getExamLanguage());
        }

        return builder.build();
    }
}