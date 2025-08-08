package lk.ijse.gdse72.backend.service;

import lk.ijse.gdse72.backend.entity.Notification;

import java.util.List;

public interface NotificationService {
    List<Notification> getNotificationsByDriver(String driverId);
    int getUnreadNotificationCount(String driverId);
    void createNotification(String driverId, String message, Long applicationId);
    void markAsRead(Long notificationId);
}
