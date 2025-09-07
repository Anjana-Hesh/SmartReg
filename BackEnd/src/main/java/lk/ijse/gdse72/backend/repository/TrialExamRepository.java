package lk.ijse.gdse72.backend.repository;

import lk.ijse.gdse72.backend.entity.TrialExam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrialExamRepository extends JpaRepository<TrialExam, Long> {
    List<TrialExam> findByWrittenExamId(Long writtenExamId);
    Optional<TrialExam> findFirstByWrittenExamIdOrderByTrialDateDesc(Long writtenExamId);
    boolean existsByWrittenExamIdAndTrialResult(Long writtenExamId, String trialResult);

    boolean existsById(Long id);

    // Find by written exam ID and result
    List<TrialExam> findByWrittenExamIdAndTrialResult(Long writtenExamId, String trialResult);

    // Custom query for better performance when fetching with written exam
    @Query("SELECT t FROM TrialExam t JOIN FETCH t.writtenExam w WHERE t.id = :id")
    Optional<TrialExam> findByIdWithWrittenExam(@Param("id") Long id);
}