package lk.ijse.gdse72.backend.repository;

import lk.ijse.gdse72.backend.entity.ExamSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExamScheduleRepository extends JpaRepository<ExamSchedule, Long> {
    Optional<ExamSchedule> findByWrittenExamId(Long writtenExamId);
    boolean existsByWrittenExamId(Long writtenExamId);
}