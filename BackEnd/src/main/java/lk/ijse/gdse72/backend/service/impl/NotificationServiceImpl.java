package lk.ijse.gdse72.backend.service.impl;

import lk.ijse.gdse72.backend.entity.Notification;
import lk.ijse.gdse72.backend.repository.NotificationRepository;
import lk.ijse.gdse72.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private NotificationRepository notificationRepository;

    @Override
    public List<Notification> getNotificationsByDriver(String driverId) {
        return notificationRepository.findByDriverIdOrderByDateDesc(driverId);
    }

    @Override
    public int getUnreadNotificationCount(String driverId) {
        return notificationRepository.countByDriverIdAndReadFalse(driverId);
    }

    @Override
    public void createNotification(String driverId, String message, Long applicationId) {
        Notification notification = new Notification();
        notification.setDriverId(driverId);
        notification.setMessage(message);
        notification.setApplicationId(applicationId);
        notificationRepository.save(notification);
    }

    @Override
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }
}
