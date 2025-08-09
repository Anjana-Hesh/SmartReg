package lk.ijse.gdse72.backend.repository;

import lk.ijse.gdse72.backend.entity.Application;
import lk.ijse.gdse72.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DriverRepository extends JpaRepository<Application, Long> {
    // Find driver by ID (only DRIVER role)
    @Query("SELECT u FROM User u WHERE u.id = :id AND u.role = 'DRIVER'")
    User findDriverById(@Param("id") Long id);

    // Get all drivers (only DRIVER role)
    @Query("SELECT u FROM User u WHERE u.role = 'DRIVER'")
    List<User> findAllDrivers();
}
