package org.pucar.dristi.web.models.docpreview;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocPreviewRequest {

    @JsonProperty("requestInfo")
    private RequestInfo requestInfo;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("courtId")
    private String courtId;

}
