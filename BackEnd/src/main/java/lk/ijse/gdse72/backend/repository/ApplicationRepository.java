package lk.ijse.gdse72.backend.repository;

import lk.ijse.gdse72.backend.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    @Query("SELECT a FROM Application a LEFT JOIN FETCH a.driver WHERE a.driver.id = :driverId")
    List<Application> findByDriverId(Long driverId);

    @Query("SELECT a FROM Application a LEFT JOIN FETCH a.driver")
    List<Application> findAll();

    List<Application> findByDriverIdAndStatus(Long driverId, String status);
    int countByDriverIdAndStatus(Long driverId, String status);
}
