package lk.ijse.gdse72.backend.controller;

import lk.ijse.gdse72.backend.dto.ApiResponse;
import lk.ijse.gdse72.backend.dto.LicenseDTO;
import lk.ijse.gdse72.backend.service.LicenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/licenses")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LicenseController {

    private final LicenseService licenseService;

    /**
     * Generate license for passed trial exam (called automatically)
     */
    @PostMapping("/generate/{trialExamId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> generateLicense(@PathVariable Long trialExamId) {
        ApiResponse response = licenseService.generateLicenseForPassedTrial(trialExamId);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    /**
     * Get license by ID
     */
    @GetMapping("/{licenseId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<ApiResponse> getLicenseById(@PathVariable Long licenseId) {
        ApiResponse response = licenseService.getLicenseById(licenseId);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    /**
     * Get license by license number
     */
    @GetMapping("/number/{licenseNumber}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DRIVER')")
    public ResponseEntity<ApiResponse> getLicenseByNumber(@PathVariable String licenseNumber) {
        ApiResponse response = licenseService.getLicenseByNumber(licenseNumber);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    /**
     * Get all licenses for a driver by NIC
     */
    @GetMapping("/driver/{nicNumber}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('DRIVER') and #nicNumber == authentication.principal.username)")
    public ResponseEntity<ApiResponse> getLicensesByDriverNic(@PathVariable String nicNumber) {
        ApiResponse response = licenseService.getLicensesByDriverNic(nicNumber);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    /**
     * Get all active licenses
     */
    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> getAllActiveLicenses() {
        ApiResponse response = licenseService.getAllActiveLicenses();
        return ResponseEntity.status(response.getCode()).body(response);
    }

    /**
     * Get all expired licenses
     */
    @GetMapping("/expired")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> getAllExpiredLicenses() {
        ApiResponse response = licenseService.getAllExpiredLicenses();
        return ResponseEntity.status(response.getCode()).body(response);
    }

    /**
     * Get all licenses
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> getAllLicenses() {
        ApiResponse response = licenseService.getAllLicenses();
        return ResponseEntity.status(response.getCode()).body(response);
    }

    /**
     * Update license details
     */
    @PutMapping("/{licenseId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> updateLicense(
            @PathVariable Long licenseId,
            @RequestBody LicenseDTO licenseDTO) {
        ApiResponse response = licenseService.updateLicense(licenseId, licenseDTO);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    /**
     * Deactivate license (soft delete)
     */
    @DeleteMapping("/{licenseId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteLicense(@PathVariable Long licenseId) {
        ApiResponse response = licenseService.deleteLicense(licenseId);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    /**
     * Check if license exists for trial exam
     */
    @GetMapping("/exists/trial/{trialExamId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Boolean> licenseExistsForTrial(@PathVariable Long trialExamId) {
        boolean exists = licenseService.licenseExistsForTrial(trialExamId);
        return ResponseEntity.ok(exists);
    }

    /**
     * Get license by trial exam ID
     */
    @GetMapping("/trial/{trialExamId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DRIVER')")
    public ResponseEntity<ApiResponse> getLicenseByTrialExamId(@PathVariable Long trialExamId) {
        ApiResponse response = licenseService.getLicenseByTrialExamId(trialExamId);
        return ResponseEntity.status(response.getCode()).body(response);
    }
}