package lk.ijse.gdse72.backend.repository;

import lk.ijse.gdse72.backend.entity.WrittenExam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WrittenExamRepository extends JpaRepository<WrittenExam, Long> {

    /**
     * Find written exam by application ID
     */
    Optional<WrittenExam> findByApplicationId(Long applicationId);

    /**
     * Find all written exams for a specific application
     */
    List<WrittenExam> findAllByApplicationId(Long applicationId);

    /**
     * Find written exams by result
     */
    List<WrittenExam> findByWrittenExamResult(String result);

    /**
     * Check if a written exam exists for an application
     */
    boolean existsByApplicationId(Long applicationId);

    /**
     * Find written exams with application details
     */
    @Query("SELECT we FROM WrittenExam we JOIN FETCH we.application WHERE we.id = :examId")
    Optional<WrittenExam> findByIdWithApplication(@Param("examId") Long examId);

    /**
     * Find all written exams with application details
     */
    @Query("SELECT we FROM WrittenExam we JOIN FETCH we.application")
    List<WrittenExam> findAllWithApplication();
}