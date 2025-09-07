package lk.ijse.gdse72.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "trial_exams")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrialExam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "written_exam_id", nullable = false)
    private WrittenExam writtenExam;

    @Column(nullable = false)
    private LocalDate trialDate;

    private LocalTime trialTime;
    private String trialLocation;

    private String trialResult;

    @Column(columnDefinition = "TEXT")
    private String examinerNotes;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}