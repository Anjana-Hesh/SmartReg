package lk.ijse.gdse72.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

public class DriverDTO {
    private Long id;
    private String fullName;
    private String userName;
    private String email;
    private int phoneNumber;
    private List<ApplicationDTO> applications;
    private List<NotificationDTO> notifications;
}
