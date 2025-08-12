package lk.ijse.gdse72.backend.controller;

import lk.ijse.gdse72.backend.dto.DeclineDTO;
import lk.ijse.gdse72.backend.service.DeclineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/declines")
@RequiredArgsConstructor
public class DeclineController {

    private final DeclineService declineService;

    @PostMapping("/create-decline")
    public ResponseEntity<?> createDecline(@RequestBody DeclineDTO declineDTO) {
        try {
            DeclineDTO createdDecline = declineService.createDecline(declineDTO);
            return ResponseEntity.ok(createdDecline);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message", "Failed to create decline record",
                            "error", e.getMessage()
                    ));
        }
    }

    @GetMapping("/getalldecines")
    public ResponseEntity<List<DeclineDTO>> getAllDeclines() {
        List<DeclineDTO> declines = declineService.getAllDeclines();
        return ResponseEntity.ok(declines);
    }
}