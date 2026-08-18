package org.pucar.dristi.web.models;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.models.AuditDetails;

import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class JoinCaseV2Request {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("joinCaseData")
    @Valid
    private JoinCaseDataV2 joinCaseData = null;
}
