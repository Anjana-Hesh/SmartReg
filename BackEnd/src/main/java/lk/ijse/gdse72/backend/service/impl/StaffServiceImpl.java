package lk.ijse.gdse72.backend.service.impl;

import lk.ijse.gdse72.backend.dto.StaffDTO;
import lk.ijse.gdse72.backend.entity.*;
import lk.ijse.gdse72.backend.repository.StaffRepository;
import lk.ijse.gdse72.backend.repository.UserRepository;
import lk.ijse.gdse72.backend.service.StaffService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;

    @Override
    public StaffDTO createStaff(StaffDTO staffDTO) {
        try {
            // Check if staff ID or email already exists
            if (staffRepository.existsByStaffId(staffDTO.getStaffId())) {
                throw new RuntimeException("Staff ID already exists");
            }
            if (staffRepository.existsByEmail(staffDTO.getEmail())) {
                throw new RuntimeException("Email already exists");
            }


            // Create Staff
            Staff staff = Staff.builder()
                    .staffId(staffDTO.getStaffId() != null ? staffDTO.getStaffId() : generateStaffId())
                    .name(staffDTO.getName())
                    .department(staffDTO.getDepartment())
                    .email(staffDTO.getEmail())
                    .phone(staffDTO.getPhone())
                    .status(staffDTO.getStatus() != null ? staffDTO.getStatus() : StaffStatus.ACTIVE)
                    .isAdmin(staffDTO.isAdmin())
//                    .user(user)
                    .build();

            Staff savedStaff = staffRepository.save(staff);
            log.info("Staff created successfully with ID: {}", savedStaff.getStaffId());

            return mapToDTO(savedStaff);
        } catch (Exception e) {
            log.error("Error creating staff: {}", e.getMessage());
            throw new RuntimeException("Failed to create staff: " + e.getMessage());
        }
    }

    @Override
    public StaffDTO updateStaff(Long id, StaffDTO staffDTO) {
        try {
            Staff existingStaff = staffRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Staff not found"));

            // Update Staff fields
            existingStaff.setName(staffDTO.getName());
            existingStaff.setDepartment(staffDTO.getDepartment());
            existingStaff.setEmail(staffDTO.getEmail());
            existingStaff.setPhone(staffDTO.getPhone());
            existingStaff.setStatus(staffDTO.getStatus());
            existingStaff.setAdmin(staffDTO.isAdmin());

            Staff updatedStaff = staffRepository.save(existingStaff);
            log.info("Staff updated successfully with ID: {}", updatedStaff.getStaffId());

            return mapToDTO(updatedStaff);
        } catch (Exception e) {
            log.error("Error updating staff: {}", e.getMessage());
            throw new RuntimeException("Failed to update staff: " + e.getMessage());
        }
    }

    @Override
    public void deleteStaff(Long id) {
        try {
            Staff staff = staffRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Staff not found"));

            staffRepository.delete(staff);
            log.info("Staff deleted successfully with ID: {}", staff.getStaffId());
        } catch (Exception e) {
            log.error("Error deleting staff: {}", e.getMessage());
            throw new RuntimeException("Failed to delete staff: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public StaffDTO getStaffById(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        return mapToDTO(staff);
    }

    @Override
    @Transactional(readOnly = true)
    public StaffDTO getStaffByStaffId(String staffId) {
        Staff staff = staffRepository.findByStaffId(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        return mapToDTO(staff);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffDTO> getAllStaff() {
        return staffRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffDTO> getStaffByStatus(StaffStatus status) {
        return staffRepository.findByStatus(status)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffDTO> getStaffByDepartment(String department) {
        return staffRepository.findByDepartment(department)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffDTO> getAdminStaff() {
        return staffRepository.findByIsAdmin(true)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffDTO> searchStaffByName(String name) {
        return staffRepository.findByNameContaining(name)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void updateStaffStatus(Long id, StaffStatus status) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        staff.setStatus(status);

        staffRepository.save(staff);
        log.info("Staff status updated for ID: {} to {}", staff.getStaffId(), status);
    }

    @Override
    public void updateAdminStatus(Long id, boolean isAdmin) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        staff.setAdmin(isAdmin);

        staffRepository.save(staff);
        log.info("Admin status updated for ID: {} to {}", staff.getStaffId(), isAdmin);
    }

    @Override
    public String generateStaffId() {
        String lastStaffId = staffRepository.findLastStaffId();

        if (lastStaffId == null) {
            return "STF001";
        }

        try {
            int lastNumber = Integer.parseInt(lastStaffId.substring(3));
            return String.format("STF%03d", lastNumber + 1);
        } catch (NumberFormatException e) {
            return "STF001";
        }
    }

    private StaffDTO mapToDTO(Staff staff) {
        StaffDTO dto = StaffDTO.builder()
                .id(staff.getId())
                .staffId(staff.getStaffId())
                .name(staff.getName())
                .department(staff.getDepartment())
                .email(staff.getEmail())
                .phone(staff.getPhone())
                .status(staff.getStatus())
                .isAdmin(staff.isAdmin())
                .build();

        return dto;
    }
}