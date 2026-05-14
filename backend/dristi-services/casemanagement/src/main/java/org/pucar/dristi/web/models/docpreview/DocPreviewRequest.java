package org.pucar.dristi.web.models.docpreview;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

import jakarta.validation.constraints.NotNull;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocPreviewRequest {

    @JsonProperty("RequestInfo")
    @Valid
    @NotNull
    private RequestInfo requestInfo;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId;

    @JsonProperty("filingNumber")
    @Valid
    @NotNull
    private String filingNumber;

    @JsonProperty("ctcApplicationNumber")
    @Valid
    private String ctcApplicationNumber;

    @JsonProperty("isCaseFileView")
    @Valid
    private Boolean isCaseFileView = false;

    @JsonProperty("courtId")
    @NotNull
    private String courtId;

}
