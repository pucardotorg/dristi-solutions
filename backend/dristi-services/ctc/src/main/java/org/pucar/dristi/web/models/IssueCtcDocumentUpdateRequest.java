package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueCtcDocumentUpdateRequest {

    @JsonProperty("RequestInfo")
    @NotNull
    private RequestInfo requestInfo;

    @JsonProperty("ctcApplicationNumber")
    @NotBlank
    private String ctcApplicationNumber;

    @JsonProperty("id")
    @NotBlank
    private String id;

    @JsonProperty("docId")
    @NotBlank
    private String docId;

    @JsonProperty("filingNumber")
    @NotBlank
    private String filingNumber;

    @JsonProperty("courtId")
    @NotBlank
    private String courtId;

}
