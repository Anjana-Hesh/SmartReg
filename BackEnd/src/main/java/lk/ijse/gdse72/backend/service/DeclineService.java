package lk.ijse.gdse72.backend.service;

import lk.ijse.gdse72.backend.dto.DeclineDTO;

import java.util.List;

public interface DeclineService {
    List<DeclineDTO> getAllDeclines();

    DeclineDTO createDecline(DeclineDTO declineDTO);

    DeclineDTO findDeclineByApplicationId(Long applicationId);
}
