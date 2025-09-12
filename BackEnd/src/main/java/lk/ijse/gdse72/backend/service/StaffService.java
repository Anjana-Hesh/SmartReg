package lk.ijse.gdse72.backend.service;

import lk.ijse.gdse72.backend.dto.StaffDTO;
import lk.ijse.gdse72.backend.entity.StaffStatus;

import java.util.List;

public interface StaffService {

    StaffDTO createStaff(StaffDTO staffDTO);

    StaffDTO updateStaff(Long id, StaffDTO staffDTO);

    void deleteStaff(Long id);

    StaffDTO getStaffById(Long id);

    StaffDTO getStaffByStaffId(String staffId);

    List<StaffDTO> getAllStaff();

    List<StaffDTO> getStaffByStatus(StaffStatus status);

    List<StaffDTO> getStaffByDepartment(String department);

    List<StaffDTO> getAdminStaff();

    List<StaffDTO> searchStaffByName(String name);

    void updateStaffStatus(Long id, StaffStatus status);

    void updateAdminStatus(Long id, boolean isAdmin);

    String generateStaffId();

}