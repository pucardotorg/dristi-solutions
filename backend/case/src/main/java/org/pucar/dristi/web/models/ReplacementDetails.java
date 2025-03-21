package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReplacementDetails {
    @Valid
    @JsonProperty("advocateDetails")
    private ReplacementAdvocateDetails advocateDetails;

    @NotNull
    @Valid
    @JsonProperty("litigantDetails")
    private LitigantDetails litigantDetails;

    @NotNull
    @Valid
    @JsonProperty("document")
    private ReplacementDocumentDetails document;

    @NotNull
    @JsonProperty("isLitigantPip")
    private Boolean isLitigantPip;
}
