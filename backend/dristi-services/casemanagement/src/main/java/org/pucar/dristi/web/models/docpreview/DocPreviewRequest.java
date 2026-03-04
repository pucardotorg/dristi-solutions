package org.pucar.dristi.web.models.docpreview;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.pucar.dristi.web.models.CaseBundleNode;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocPreviewRequest {

    @JsonProperty("requestInfo")
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
    @NotNull
    private String ctcApplicationNumber;

    @JsonProperty("courtId")
    @NotNull
    private String courtId;

}
