package lk.ijse.gdse72.backend.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

public class RegisterDTO {

    private Long id;

    @NotBlank(message = "Full name is required")
//    @Size(min = 3, max = 100, message = "Full name must be 3-100 characters")
    private String fullName;

    @NotBlank(message = "Username is required")
    @Size(min = 4, max = 20, message = "Username must be 4-20 characters")
//    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username can only contain letters, numbers, and underscores")
    private String userName;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
            message = "Password must contain upper & lowercase letters, a number and a special character"
    )
    private String password;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotNull(message = "Phone number is required")
//    @Pattern(regexp = "\\d{10}", message = "Phone number must be 10 digits")
    private Integer phoneNumber;

    private String role = "DRIVER";  // Default value
    private String status = "INACTIVE";  // Default value
    private boolean isAdmin = false;  // Default value

}
