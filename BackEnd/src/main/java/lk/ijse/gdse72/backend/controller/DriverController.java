package lk.ijse.gdse72.backend.controller;


import lk.ijse.gdse72.backend.dto.DriverDTO;
import lk.ijse.gdse72.backend.service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/drivers")
@RequiredArgsConstructor

public class DriverController {

    private final DriverService driverService;


    @GetMapping("/{driverId}")
    public ResponseEntity<DriverDTO> getDriverProfile(
            @PathVariable Long driverId,
            @RequestHeader("Authorization") String token
    ) {
        // (Optional: Validate token here)
        DriverDTO driverProfile = driverService.getDriverProfile(driverId);
        return ResponseEntity.ok(driverProfile);
    }
}
