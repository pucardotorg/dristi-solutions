package org.pucar.dristi.web.models.bailbond;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.Document;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OpenApiBailResponse {

    @JsonProperty("bailId")
    private String bailId = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("caseId")
    @NotNull
    private String caseId = null;

    @JsonProperty("litigantSigned")
    private Boolean litigantSigned = null;

    @JsonProperty("litigantName")
    private String litigantName = null;

    @JsonProperty("phoneNumber")
    private String phoneNumber = null;

    @JsonProperty("documents")
    @Valid
    private List<Document> documents = null;


    @JsonProperty("sureties")
    @Valid
    private List<OpenApiSurety> sureties = null;


    @JsonProperty("filingNumber")
    private String filingNumber = null;


}
