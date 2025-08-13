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

    @Query("SELECT we FROM WrittenExam we " +
            "LEFT JOIN FETCH we.application a " +
            "LEFT JOIN FETCH a.driver " +
            "WHERE we.application.id = :applicationId")
    Optional<WrittenExam> findByApplicationId(@Param("applicationId") Long applicationId);

    @Query("SELECT we FROM WrittenExam we " +
            "LEFT JOIN FETCH we.application a " +
            "LEFT JOIN FETCH a.driver " +
            "WHERE we.writtenExamResult = :result")
    List<WrittenExam> findByWrittenExamResultWithApplication(@Param("result") String result);

    List<WrittenExam> findByWrittenExamResult(String result);

    boolean existsByApplicationId(Long applicationId);

    @Query("SELECT we FROM WrittenExam we " +
            "LEFT JOIN FETCH we.application a " +
            "LEFT JOIN FETCH a.driver " +
            "WHERE we.id = :examId")
    Optional<WrittenExam> findByIdWithApplication(@Param("examId") Long examId);

    @Query("SELECT we FROM WrittenExam we " +
            "LEFT JOIN FETCH we.application a " +
            "LEFT JOIN FETCH a.driver")
    List<WrittenExam> findAllWithApplication();
}