package lk.ijse.gdse72.backend.repository;

import lk.ijse.gdse72.backend.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByDriverId(String driverId);
    List<Application> findByDriverIdAndStatus(String driverId, String status);
    int countByDriverIdAndStatus(String driverId, String status);

}
