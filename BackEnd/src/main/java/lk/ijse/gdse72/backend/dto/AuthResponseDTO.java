//package lk.ijse.gdse72.backend.dto;
//
//import lombok.AllArgsConstructor;
//import lombok.Getter;
//import lombok.NoArgsConstructor;
//import lombok.Setter;
//
//@Getter
//@Setter
//@AllArgsConstructor
//@NoArgsConstructor
//
//public class AuthResponseDTO {
//    private String accessToken;
//}


package lk.ijse.gdse72.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponseDTO {
    private String accessToken;  // JWT token for authentication
    private String role;         // User role (e.g., "ADMIN", "DRIVER")
    private String userName;     // Username (optional)
    private String name;        // Full name (optional)
    private Long userId;        // User ID (optional)
}