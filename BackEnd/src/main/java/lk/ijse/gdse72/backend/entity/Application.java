package lk.ijse.gdse72.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "application")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

//    @Column(name = "driver_id", nullable = false)
//    private String driverId;

    @Column(name = "license_type", nullable = false)
    private String licenseType;

    @Column(name = "exam_language", nullable = false)
    private String examLanguage;

    @ElementCollection
    @CollectionTable(name = "application_vehicle_classes", joinColumns = @JoinColumn(name = "application_id"))
    @Column(name = "vehicle_class")
    private List<String> vehicleClasses;

    @Column(name = "nic_number", nullable = false)
    private String nicNumber;

    @Column(name = "blood_group")
    private String bloodGroup;

    @Column(name = "date_of_birth", nullable = false)
    private String dateOfBirth;

    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @Column(name = "address", nullable = false)
    private String address;

    @Column(name = "photo_path", nullable = false)
    private String photoPath;

    @Column(name = "medical_path", nullable = false)
    private String medicalCertificatePath;

    @Column(name = "status", nullable = false)
    private String status = "PENDING";

    @ManyToOne(fetch = FetchType.LAZY ,  cascade = {CascadeType.ALL})
    @JoinColumn(name = "driver_id")
    private User driver;

    @Column(name = "submitted_date")
    private LocalDateTime submittedDate;
}
