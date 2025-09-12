package lk.ijse.gdse72.backend.controller;

import lk.ijse.gdse72.backend.dto.StaffDTO;
import lk.ijse.gdse72.backend.entity.StaffStatus;
import lk.ijse.gdse72.backend.service.StaffService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class StaffController {

    private final StaffService staffService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createStaff(@Valid @RequestBody StaffDTO staffDTO) {
        try {
            log.info("Creating new staff member: {}", staffDTO.getName());
            StaffDTO createdStaff = staffService.createStaff(staffDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Staff created successfully",
                            "data", createdStaff
                    ));
        } catch (Exception e) {
            log.error("Error creating staff: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getAllStaff() {
        try {
            List<StaffDTO> staffList = staffService.getAllStaff();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", staffList
            ));
        } catch (Exception e) {
            log.error("Error fetching all staff: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", "Failed to fetch staff list"
                    ));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getStaffById(@PathVariable Long id) {
        try {
            StaffDTO staff = staffService.getStaffById(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", staff
            ));
        } catch (Exception e) {
            log.error("Error fetching staff by ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }

    @GetMapping("/staff-id/{staffId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getStaffByStaffId(@PathVariable String staffId) {
        try {
            StaffDTO staff = staffService.getStaffByStaffId(staffId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", staff
            ));
        } catch (Exception e) {
            log.error("Error fetching staff by staff ID {}: {}", staffId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStaff(@PathVariable Long id, @Valid @RequestBody StaffDTO staffDTO) {
        try {
            log.info("Updating staff member with ID: {}", id);
            StaffDTO updatedStaff = staffService.updateStaff(id, staffDTO);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Staff updated successfully",
                    "data", updatedStaff
            ));
        } catch (Exception e) {
            log.error("Error updating staff ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteStaff(@PathVariable Long id) {
        try {
            log.info("Deleting staff member with ID: {}", id);
            staffService.deleteStaff(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Staff deleted successfully"
            ));
        } catch (Exception e) {
            log.error("Error deleting staff ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getStaffByStatus(@PathVariable String status) {
        try {
            StaffStatus staffStatus = StaffStatus.valueOf(status.toUpperCase());
            List<StaffDTO> staffList = staffService.getStaffByStatus(staffStatus);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", staffList
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", "Invalid status value"
                    ));
        } catch (Exception e) {
            log.error("Error fetching staff by status {}: {}", status, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", "Failed to fetch staff by status"
                    ));
        }
    }

    @GetMapping("/department/{department}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> getStaffByDepartment(@PathVariable String department) {
        try {
            List<StaffDTO> staffList = staffService.getStaffByDepartment(department);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", staffList
            ));
        } catch (Exception e) {
            log.error("Error fetching staff by department {}: {}", department, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", "Failed to fetch staff by department"
                    ));
        }
    }

    @GetMapping("/admins")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAdminStaff() {
        try {
            List<StaffDTO> adminStaff = staffService.getAdminStaff();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", adminStaff
            ));
        } catch (Exception e) {
            log.error("Error fetching admin staff: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", "Failed to fetch admin staff"
                    ));
        }
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<?> searchStaffByName(@RequestParam String name) {
        try {
            List<StaffDTO> staffList = staffService.searchStaffByName(name);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", staffList
            ));
        } catch (Exception e) {
            log.error("Error searching staff by name {}: {}", name, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", "Failed to search staff"
                    ));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStaffStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            StaffStatus staffStatus = StaffStatus.valueOf(status.toUpperCase());
            staffService.updateStaffStatus(id, staffStatus);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Staff status updated successfully"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", "Invalid status value"
                    ));
        } catch (Exception e) {
            log.error("Error updating staff status for ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }

    @PatchMapping("/{id}/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAdminStatus(@PathVariable Long id, @RequestParam boolean isAdmin) {
        try {
            staffService.updateAdminStatus(id, isAdmin);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Admin status updated successfully"
            ));
        } catch (Exception e) {
            log.error("Error updating admin status for ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }

    @GetMapping("/generate-staff-id")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> generateStaffId() {
        try {
            String staffId = staffService.generateStaffId();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of("staffId", staffId)
            ));
        } catch (Exception e) {
            log.error("Error generating staff ID: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", "Failed to generate staff ID"
                    ));
        }
    }

}