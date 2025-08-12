package lk.ijse.gdse72.backend.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lk.ijse.gdse72.backend.dto.DeclineDTO;
import lk.ijse.gdse72.backend.entity.Application;
import lk.ijse.gdse72.backend.entity.DeclineEntity;
import lk.ijse.gdse72.backend.repository.ApplicationRepository;
import lk.ijse.gdse72.backend.repository.DeclineRepo;
import lk.ijse.gdse72.backend.service.DeclineService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class DeclineServiceImpl implements DeclineService {

    private final DeclineRepo declineRepo;
    private final ApplicationRepository applicationRepo;
    private final ModelMapper modelMapper;

    @Override
    public DeclineDTO createDecline(DeclineDTO declineDTO) {
        try {
            // Validate required fields
            if (declineDTO.getApplicationId() == null) {
                throw new IllegalArgumentException("Application ID is required");
            }
            if (declineDTO.getDeclineReason() == null || declineDTO.getDeclineReason().isEmpty()) {
                throw new IllegalArgumentException("Decline reason is required");
            }

            // Create new decline entity
            DeclineEntity declineEntity = new DeclineEntity();

            // Set basic fields
            declineEntity.setDeclineReason(declineDTO.getDeclineReason());
            declineEntity.setDeclineNotes(declineDTO.getDeclineNotes());
            declineEntity.setDeclinedBy(declineDTO.getDeclinedBy());
            declineEntity.setDeclinedAt(LocalDateTime.now());

            // Set application reference (without loading full application)
            Application application = new Application();
            application.setId(declineDTO.getApplicationId());
            declineEntity.setApplication(application);

            // Save the decline entity
            DeclineEntity savedEntity = declineRepo.save(declineEntity);

            return modelMapper.map(savedEntity, DeclineDTO.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create decline record: " + e.getMessage(), e);
        }
    }

    @Override
    public List<DeclineDTO> getAllDeclines() {
        return declineRepo.findAll().stream()
                .map(decline -> modelMapper.map(decline, DeclineDTO.class))
                .collect(Collectors.toList());
    }
}