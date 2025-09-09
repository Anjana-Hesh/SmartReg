package lk.ijse.gdse72.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Builder
public class License {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String licenseNumber;

    private LocalDate issueDate;

    private LocalDate expireDate;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trial_exam_id", referencedColumnName = "id", nullable = false)
    private TrialExam trialExam;
}
