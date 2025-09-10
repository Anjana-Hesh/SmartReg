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

    Optional<License> findByTrialExamId(Long trialExamId);

    Optional<License> findByLicenseNumber(String licenseNumber);

    boolean existsByTrialExamId(Long trialExamId);

    @Query("SELECT l FROM License l " +
            "JOIN l.trialExam te " +
            "JOIN te.writtenExam we " +
            "JOIN we.application a " +
            "WHERE a.nicNumber = :nicNumber")
    List<License> findLicensesByDriverNic(@Param("nicNumber") String nicNumber);

    @Query("SELECT l FROM License l WHERE l.expireDate > CURRENT_DATE")
    List<License> findAllActiveLicenses();

    @Query("SELECT l FROM License l WHERE l.expireDate <= CURRENT_DATE")
    List<License> findAllExpiredLicenses();

    @Query("SELECT l FROM License l " +
            "JOIN FETCH l.trialExam te " +
            "JOIN FETCH te.writtenExam we " +
            "JOIN FETCH we.application a " +
            "WHERE l.id = :licenseId")
    Optional<License> findLicenseWithDriverDetails(@Param("licenseId") Long licenseId);
}