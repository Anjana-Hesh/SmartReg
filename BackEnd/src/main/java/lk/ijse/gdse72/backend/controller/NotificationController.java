package lk.ijse.gdse72.backend.controller;

import lk.ijse.gdse72.backend.dto.NotificationDTO;
import lk.ijse.gdse72.backend.entity.Notification;
import lk.ijse.gdse72.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("api/v1/notifications")
@RequiredArgsConstructor
@CrossOrigin
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestParam String driverId) {
        return ResponseEntity.ok(notificationService.getNotificationsByDriver(driverId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Integer> getUnreadNotificationCount(
            @RequestParam String driverId) {
        return ResponseEntity.ok(notificationService.getUnreadNotificationCount(driverId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markNotificationAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }
}
