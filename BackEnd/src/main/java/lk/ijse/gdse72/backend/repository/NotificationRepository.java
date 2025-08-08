package lk.ijse.gdse72.backend.repository;

import lk.ijse.gdse72.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByDriverIdOrderByDateDesc(String driverId);
    int countByDriverIdAndReadFalse(String driverId);

}
