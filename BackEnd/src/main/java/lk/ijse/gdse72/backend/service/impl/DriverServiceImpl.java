package lk.ijse.gdse72.backend.service.impl;

import lk.ijse.gdse72.backend.dto.*;
import lk.ijse.gdse72.backend.entity.*;
import lk.ijse.gdse72.backend.repository.*;
import lk.ijse.gdse72.backend.service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class DriverServiceImpl implements DriverService {

    private final  DriverRepository driverRepository;

    private final ApplicationRepository applicationRepository;

    private final NotificationRepository notificationRepository;

    @Override
    public DriverDTO getDriverProfile(Long driverId) {
        // 1. Fetch Driver (User) data
        User driver = driverRepository.findDriverById(driverId);
        if (driver == null) throw new RuntimeException("Driver not found");

        // 2. Fetch Applications with Vehicle Classes
        List<Application> applications = applicationRepository.findByDriverId(driverId.toString());
        List<ApplicationDTO> applicationDTOs = applications.stream()
                .map(app -> new ApplicationDTO(
                        app.getId(),
                        app.getDriverId(),
                        app.getLicenseType(),
                        app.getExamLanguage(),
                        app.getVehicleClasses(),
                        app.getNicNumber(),
                        app.getBloodGroup(),
                        app.getDateOfBirth(),
                        app.getPhoneNumber(),
                        app.getAddress(),
                        app.getPhotoPath(),
                        app.getMedicalCertificatePath(),
                        app.getStatus()
                ))
                .collect(Collectors.toList());

        // 3. Fetch Notifications
        List<Notification> notifications = notificationRepository.findByDriverIdOrderByDateDesc(driverId.toString());
        List<NotificationDTO> notificationDTOs = notifications.stream()
                .map(notif -> new NotificationDTO(
                        notif.getId(),
                        notif.getMessage(),
                        notif.isRead(),
                        notif.getDate()
                ))
                .collect(Collectors.toList());

        // 4. Build and return DriverDTO
        return new DriverDTO(
                driver.getId(),
                driver.getFullName(),
                driver.getUserName(),
                driver.getEmail(),
                driver.getPhoneNumber(),
                applicationDTOs,
                notificationDTOs
        );
    }

    // Helper method to get vehicle class description
    private String getVehicleClassDescription(String code) {
        return VehicleClass.getDescription(code);
    }
}