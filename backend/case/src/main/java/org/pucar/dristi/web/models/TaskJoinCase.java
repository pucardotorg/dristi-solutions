package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskJoinCase {
    @NotNull
    @Valid
    @JsonProperty("advocateDetails")
    private AdvocateDetails advocateDetails;

    @NotNull
    @JsonProperty("reason")
    private String reason;

    @NotNull
    @Valid
    @JsonProperty("reasonDocument")
    private ReasonDocument reasonDocument;

    @NotNull
    @Valid
    @JsonProperty("replacementDetails")
    private List<ReplacementDetails> replacementDetails;
}

