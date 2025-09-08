package lk.ijse.gdse72.backend.repository;

import lk.ijse.gdse72.backend.entity.Payment;
import lk.ijse.gdse72.backend.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByTransactionId(String transactionId);

    Optional<Payment> findByPayhereOrderId(String payhereOrderId);

    List<Payment> findByDriverIdOrderByCreatedDateDesc(String driverId);

    List<Payment> findByApplicationIdAndStatus(Long applicationId, PaymentStatus status);

    @Query("SELECT p FROM Payment p WHERE p.applicationId = :applicationId AND p.status = :status")
    Optional<Payment> findCompletedPaymentByApplicationId(@Param("applicationId") Long applicationId,
                                                          @Param("status") PaymentStatus status);

    @Query("SELECT p FROM Payment p WHERE p.driverId = :driverId AND p.status IN :statuses")
    List<Payment> findByDriverIdAndStatusIn(@Param("driverId") String driverId,
                                            @Param("statuses") List<PaymentStatus> statuses);

    List<Payment> findByCreatedDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'COMPLETED' AND p.paymentDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalRevenueByDateRange(@Param("startDate") LocalDateTime startDate,
                                          @Param("endDate") LocalDateTime endDate);
}
