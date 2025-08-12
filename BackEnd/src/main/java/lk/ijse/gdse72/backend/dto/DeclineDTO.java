package lk.ijse.gdse72.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeclineDTO {
    private Long id;

    @NotNull(message = "Application ID is required")
    private Long applicationId;

    @NotBlank(message = "Decline reason is required")
    @Size(max = 50, message = "Decline reason must not exceed 50 characters")
    private String declineReason;

    @Size(max = 2000, message = "Decline notes must not exceed 2000 characters")
    private String declineNotes;

    private String declinedBy;
    private LocalDateTime declinedAt;
}