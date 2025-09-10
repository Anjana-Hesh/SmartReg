package lk.ijse.gdse72.backend.repository;

import lk.ijse.gdse72.backend.entity.Staff;
import lk.ijse.gdse72.backend.entity.StaffStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {

    Optional<Staff> findByStaffId(String staffId);

    Optional<Staff> findByEmail(String email);

    List<Staff> findByStatus(StaffStatus status);

    List<Staff> findByDepartment(String department);

    List<Staff> findByIsAdmin(boolean isAdmin);

    boolean existsByStaffId(String staffId);

    boolean existsByEmail(String email);

    @Query("SELECT s FROM Staff s WHERE s.name LIKE %:name%")
    List<Staff> findByNameContaining(@Param("name") String name);

    @Query("SELECT MAX(s.staffId) FROM Staff s WHERE s.staffId LIKE 'STF%'")
    String findLastStaffId();
}