package lk.ijse.gdse72.backend.service.impl;

import lk.ijse.gdse72.backend.entity.Application;
import lk.ijse.gdse72.backend.entity.Notification;
import lk.ijse.gdse72.backend.entity.User;
import lk.ijse.gdse72.backend.repository.ApplicationRepository;
import lk.ijse.gdse72.backend.repository.NotificationRepository;
import lk.ijse.gdse72.backend.repository.UserRepository;
import lk.ijse.gdse72.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;

    @Override
    public List<Notification> getNotificationsByDriver(String driverId) {
        return notificationRepository.findByDriverIdOrderByDateDesc(driverId);
    }

    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
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
}
