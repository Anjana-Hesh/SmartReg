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

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
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
        try {
            Optional<WrittenExam> examOpt = writtenExamRepository.findByApplicationId(applicationId);

            if (examOpt.isEmpty()) {
                log.debug("No written exam found for application ID: {}", applicationId);
                return Optional.empty();
            }

            WrittenExam exam = examOpt.get();
            log.debug("Found written exam: {}", exam.getId());

            // Verify application is loaded
            if (exam.getApplication() == null) {
                log.warn("Written exam {} has no application loaded, attempting to reload", exam.getId());
                // Try to reload the exam with application
                exam = writtenExamRepository.findByIdWithApplication(exam.getId())
                        .orElseThrow(() -> new IllegalStateException("Could not reload written exam with application"));
            }

            return Optional.of(convertToDto(exam));
        } catch (Exception e) {
            log.error("Error fetching written exam for application ID: " + applicationId, e);
            throw e; // Re-throw to be handled by controller
        }
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

        WrittenExam existingExam = writtenExamRepository.findByIdWithApplication(examId)
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
    public void updateExamResult(Long examId, String result, String note) {
        WrittenExam writtenExam = writtenExamRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Written exam not found"));

        writtenExam.setWrittenExamResult(result);
        writtenExam.setNote(note);

        writtenExamRepository.save(writtenExam);
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
        return writtenExamRepository.findByWrittenExamResultWithApplication(result)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByApplicationId(Long applicationId) {
        return writtenExamRepository.existsByApplicationId(applicationId);
    }

    @Override
    public WrittenExam updateWrittenExamResult(Long examId, String result, String note, LocalDate trialDate, LocalDate nextExamDate) {
        WrittenExam writtenExam = writtenExamRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Written exam not found"));

        writtenExam.setWrittenExamResult(result);
        if (note != null) {
            writtenExam.setNote(note);
        }
        if (trialDate != null) {
            writtenExam.setTrialDate(trialDate);
        }
        if (nextExamDate != null) {
            writtenExam.setNextExamDate(nextExamDate);
        }

        return writtenExamRepository.save(writtenExam);
    }

    private WrittenExamDto convertToDto(WrittenExam writtenExam) {
        Objects.requireNonNull(writtenExam, "WrittenExam cannot be null");
        Objects.requireNonNull(writtenExam.getApplication(), "Application cannot be null");

        WrittenExamDto.WrittenExamDtoBuilder builder = WrittenExamDto.builder()
                .id(writtenExam.getId())
                .writtenExamDate(writtenExam.getWrittenExamDate())
                .writtenExamTime(writtenExam.getWrittenExamTime())
                .writtenExamLocation(writtenExam.getWrittenExamLocation())
                .note(writtenExam.getNote())
                .writtenExamResult(writtenExam.getWrittenExamResult())
                .applicationId(writtenExam.getApplication().getId());

        // Safely handle driver information
        try {
            Application app = writtenExam.getApplication();
            if (app.getDriver() != null) {
                builder.driverName(app.getDriver().getFullName());
            } else {
                log.debug("Application {} has no driver associated", app.getId());
                builder.driverName(null);
            }

            builder.licenseType(app.getLicenseType())
                    .examLanguage(app.getExamLanguage());
        } catch (Exception e) {
            log.error("Error converting application/driver details for exam ID: {}", writtenExam.getId(), e);
            // Set safe defaults
            builder.driverName(null)
                    .licenseType(null)
                    .examLanguage(null);
        }

        return builder.build();
    }
}