package lk.ijse.gdse72.backend.service;

import lk.ijse.gdse72.backend.dto.AuthDTO;
import lk.ijse.gdse72.backend.dto.AuthResponseDTO;
import lk.ijse.gdse72.backend.dto.RegisterDTO;

public interface AuthServise {
    String register(RegisterDTO registerDTO);
    AuthResponseDTO authenticate(AuthDTO authDTO);

    String forgotPassword(String email);

    void resetPassword(String email, String newPassword);
}
