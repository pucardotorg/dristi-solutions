package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class JoinCaseTaskRequest {

    @JsonProperty("advocateDetails")
    private AdvocateDetails advocateDetails;

    @JsonProperty("reason")
    private String reason;

    @JsonProperty("reasonDocument")
    private ReasonDocument reasonDocument;

    @JsonProperty("replacementDetails")
    private List<ReplacementDetails> replacementDetails;

}