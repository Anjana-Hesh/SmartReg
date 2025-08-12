package lk.ijse.gdse72.backend.repository;

import lk.ijse.gdse72.backend.dto.DeclineDTO;
import lk.ijse.gdse72.backend.entity.DeclineEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeclineRepo extends JpaRepository<DeclineEntity, Long> {

    @Query("SELECT new lk.ijse.gdse72.backend.dto.DeclineDTO(" +
            "d.id, d.application.id, d.declineReason, d.declineNotes, " +
            "d.declinedBy, d.declinedAt) " +
            "FROM DeclineEntity d")
    List<DeclineDTO> findAllDeclines();
}