package lk.ijse.gdse72.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Builder
@Table(name = "exam_schedule")
public class ExamSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trial_date")
    private LocalDate trialDate;

    @Column(name = "next_exam_date")
    private LocalDate nextExamDate;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "written_exam_id", nullable = false)
    private WrittenExam writtenExam;
}