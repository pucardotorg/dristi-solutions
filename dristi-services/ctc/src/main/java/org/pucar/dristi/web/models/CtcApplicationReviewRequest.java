package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CtcApplicationReviewRequest {

    @JsonProperty("RequestInfo")
    @Valid
    @NotNull
    private RequestInfo requestInfo;

    @JsonProperty("courtId")
    @NotBlank
    private String courtId;

    @JsonProperty("action")
    @NotBlank
    private String action; // APPROVE or REJECT

    @JsonProperty("applications")
    @Valid
    @NotEmpty
    private List<ReviewItem> applications;

}
