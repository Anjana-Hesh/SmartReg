package lk.ijse.gdse72.backend.service;

import lk.ijse.gdse72.backend.dto.TrialExamDTO;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface TrialExamService {
    @Transactional
    TrialExamDTO saveTrialExamResult(TrialExamDTO trialExamDTO);

    List<TrialExamDTO> getTrialExamsByWrittenExamId(Long writtenExamId);

    TrialExamDTO getLatestTrialExam(Long writtenExamId);

    boolean hasPassedTrialExam(Long writtenExamId);

    @Transactional
    TrialExamDTO updateTrialExamResult(Long id, TrialExamDTO trialExamDTO);

    @Transactional(readOnly = true)
    TrialExamDTO getTrialExamById(Long id);

    @Transactional
    void deleteTrialExam(Long id);
}
