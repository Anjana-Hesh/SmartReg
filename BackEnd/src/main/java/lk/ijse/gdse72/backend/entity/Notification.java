package lk.ijse.gdse72.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "driver_id", nullable = false)
    private String driverId;

    @Column(name = "message", nullable = false)
    private String message;

    @Column(name = "date", nullable = false)
    private Date date = new Date();

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "application_id")
    private Long applicationId;
}
