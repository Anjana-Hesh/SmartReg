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

    private String fullName;

    private String userName;

    private String password;

    private String email;

    private Integer phoneNumber;

    @Enumerated(EnumType.STRING)
    private Role role = Role.DRIVER;                         // default role

    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.INACTIVE;        // default status

    private boolean isAdmin = false;                        // default false
}
