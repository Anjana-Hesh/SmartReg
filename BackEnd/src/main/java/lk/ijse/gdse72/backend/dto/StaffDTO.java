package lk.ijse.gdse72.backend.dto;

import lombok.*;
import lk.ijse.gdse72.backend.entity.StaffStatus;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StaffDTO {
    private Long id;
    private String staffId;
    private String name;
    private String department;
    private String email;
    private String phone;
    private StaffStatus status;
    private boolean isAdmin;

    // User details for creation
//    private String userName;
//    private String password;
//    private String fullName;
//    private Integer phoneNumber;
}