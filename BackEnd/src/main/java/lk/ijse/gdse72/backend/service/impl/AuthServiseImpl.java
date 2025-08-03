package lk.ijse.gdse72.backend.service.impl;

import lk.ijse.gdse72.backend.dto.AuthDTO;
import lk.ijse.gdse72.backend.dto.AuthResponseDTO;
import lk.ijse.gdse72.backend.dto.RegisterDTO;
import lk.ijse.gdse72.backend.entity.Role;
import lk.ijse.gdse72.backend.entity.User;
import lk.ijse.gdse72.backend.repository.UserRepository;
import lk.ijse.gdse72.backend.service.AuthServise;
import lk.ijse.gdse72.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor

public class AuthServiseImpl implements AuthServise {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public AuthResponseDTO authenticate(AuthDTO authDTO) {
        User user = userRepository.findByUserName(authDTO.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found with username: " + authDTO.getUsername()));

        if (!passwordEncoder.matches(authDTO.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Incorrect Password");
        }

        String accessToken = jwtUtil.genarateToken(user.getUserName());
        return new AuthResponseDTO(accessToken);
    }

    @Override
    public String register(RegisterDTO registerDTO){

        if (userRepository.findByUserName(registerDTO.getUserName()).isPresent()) {
            throw new RuntimeException("User already exists with username: " + registerDTO.getUserName());
        }
        User user = User.builder()
                .userName(registerDTO.getUserName())
                .password(passwordEncoder.encode(registerDTO.getPassword()))
                .role(Role.valueOf(registerDTO.getRole().toUpperCase()))
                .build();
        userRepository.save(user);
        return "User Registration Successfull ...";
    }

}
