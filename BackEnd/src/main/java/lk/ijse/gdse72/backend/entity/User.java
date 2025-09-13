package lk.ijse.gdse72.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder

@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String userName;

    @Column(nullable = true)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true, unique = true)
    private Integer phoneNumber;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Role role = Role.DRIVER;                      // default role

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;        // default status

    @Column(nullable = false)
    @Builder.Default
    private boolean isAdmin = false;                      // default false

}
