package lk.ijse.gdse72.backend.repository;

import lk.ijse.gdse72.backend.entity.TrialExam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrialExamRepository extends JpaRepository<TrialExam, Long> {
    List<TrialExam> findByWrittenExamId(Long writtenExamId);
    Optional<TrialExam> findFirstByWrittenExamIdOrderByTrialDateDesc(Long writtenExamId);
    boolean existsByWrittenExamIdAndTrialResult(Long writtenExamId, String trialResult);
}