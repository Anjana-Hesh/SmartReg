package lk.ijse.gdse72.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "declines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeclineEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "decline_reason", nullable = false, length = 50)
    private String declineReason;

    @Column(name = "decline_notes", columnDefinition = "TEXT")
    private String declineNotes;

    @Column(name = "declined_by", nullable = false)
    private String declinedBy;

    @CreationTimestamp
    @Column(name = "declined_at", nullable = false)
    private LocalDateTime declinedAt;
}