package lk.ijse.gdse72.backend.repository;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lk.ijse.gdse72.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUserName(String userName);
    boolean existsByEmail(@NotBlank(message = "Email is required") @Email(message = "Email should be valid") String email);
    Optional<User> findById(Long id);
    Optional<User> findByEmail(String email);
}
