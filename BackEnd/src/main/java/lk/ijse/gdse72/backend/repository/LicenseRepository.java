package lk.ijse.gdse72.backend.repository;

import lk.ijse.gdse72.backend.entity.License;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LicenseRepository extends JpaRepository<License, Long> {

    /**
     * Find license by trial exam ID
     */
    Optional<License> findByTrialExamId(Long trialExamId);

    /**
     * Find license by license number
     */
    Optional<License> findByLicenseNumber(String licenseNumber);

    /**
     * Check if license already exists for a trial exam
     */
    boolean existsByTrialExamId(Long trialExamId);

    /**
     * Find all licenses for a specific driver based on NIC
     */
    @Query("SELECT l FROM License l " +
            "JOIN l.trialExam te " +
            "JOIN te.writtenExam we " +
            "JOIN we.application a " +
            "WHERE a.nicNumber = :nicNumber")
    List<License> findLicensesByDriverNic(@Param("nicNumber") String nicNumber);

    /**
     * Find all active licenses (not expired)
     */
    @Query("SELECT l FROM License l WHERE l.expireDate > CURRENT_DATE")
    List<License> findAllActiveLicenses();

    /**
     * Find all expired licenses
     */
    @Query("SELECT l FROM License l WHERE l.expireDate <= CURRENT_DATE")
    List<License> findAllExpiredLicenses();

    /**
     * Find license with driver details for comprehensive information
     */
    @Query("SELECT l FROM License l " +
            "JOIN FETCH l.trialExam te " +
            "JOIN FETCH te.writtenExam we " +
            "JOIN FETCH we.application a " +
            "WHERE l.id = :licenseId")
    Optional<License> findLicenseWithDriverDetails(@Param("licenseId") Long licenseId);
}