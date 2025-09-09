package lk.ijse.gdse72.backend.service;

import lk.ijse.gdse72.backend.dto.ApiResponse;
import lk.ijse.gdse72.backend.dto.LicenseDTO;

import java.util.List;

public interface LicenseService {

    /**
     * Generate license automatically when trial exam is passed
     */
    ApiResponse generateLicenseForPassedTrial(Long trialExamId);

    /**
     * Get license by ID
     */
    ApiResponse getLicenseById(Long licenseId);

    /**
     * Get license by license number
     */
    ApiResponse getLicenseByNumber(String licenseNumber);

    /**
     * Get all licenses for a driver by NIC
     */
    ApiResponse getLicensesByDriverNic(String nicNumber);

    /**
     * Get all active licenses
     */
    ApiResponse getAllActiveLicenses();

    /**
     * Get all expired licenses
     */
    ApiResponse getAllExpiredLicenses();

    /**
     * Get all licenses
     */
    ApiResponse getAllLicenses();

    /**
     * Update license details
     */
    ApiResponse updateLicense(Long licenseId, LicenseDTO licenseDTO);

    /**
     * Delete license (soft delete by setting expiry date)
     */
    ApiResponse deleteLicense(Long licenseId);

    /**
     * Check if license exists for trial exam
     */
    boolean licenseExistsForTrial(Long trialExamId);

    /**
     * Get license by trial exam ID
     */
    ApiResponse getLicenseByTrialExamId(Long trialExamId);
}