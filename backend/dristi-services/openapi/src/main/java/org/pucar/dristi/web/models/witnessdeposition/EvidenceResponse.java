package org.pucar.dristi.web.models.witnessdeposition;

import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.web.models.Pagination;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * EvidenceResponse
 */
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EvidenceResponse {

    @JsonProperty("ResponseInfo")
    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("artifact")
    @Valid
    private Artifact artifact;


    @JsonProperty("pagination")
    @Valid
    private Pagination pagination = null;

}
