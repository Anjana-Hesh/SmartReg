package lk.ijse.gdse72.backend.service;

import lk.ijse.gdse72.backend.dto.DriverDTO;

public interface DriverService {
    DriverDTO getDriverProfile(Long driverId);
}