//package lk.ijse.gdse72.backend.entity;
//
//import jakarta.persistence.*;
//import lombok.*;
//
//import java.time.LocalDate;
//import java.time.LocalTime;
//
//@Getter
//@Setter
//@AllArgsConstructor
//@NoArgsConstructor
//@Entity
//@Builder
//public class WrittenExam {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    private LocalDate writtenExamDate;
//
//    private LocalTime writtenExamTime;
//
//    private String writtenExamLocation;
//
//    private String note;
//
//    private String writtenExamResult;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "application_id", nullable = false)
//    private Application application;                             // Driver can get using join query
//}

package lk.ijse.gdse72.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Builder
@Table(name = "written_exams")
public class WrittenExam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate writtenExamDate;
    private LocalTime writtenExamTime;
    private String writtenExamLocation;
    private String note;
    private String writtenExamResult;

    // New fields for trial exam scheduling
    private LocalDate trialDate;
    private LocalDate nextExamDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @OneToMany(mappedBy = "writtenExam", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TrialExam> trialExams = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}