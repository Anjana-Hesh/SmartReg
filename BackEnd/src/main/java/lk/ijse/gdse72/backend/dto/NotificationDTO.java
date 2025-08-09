package lk.ijse.gdse72.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

public class NotificationDTO {
    private Long id;
    private String message;
    private boolean read;
    private Date date;
}
