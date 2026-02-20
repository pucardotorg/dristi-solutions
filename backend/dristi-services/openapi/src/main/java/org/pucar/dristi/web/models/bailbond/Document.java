package org.pucar.dristi.web.models.bailbond;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

@Schema(description = "This object holds list of documents attached during the transaciton for a property")
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Document {

    @JsonProperty("id")
    @Size(max = 64)
    private String id = null;

    @JsonProperty("documentType")
    private String documentType = null;

    @JsonProperty("fileStore")
    private String fileStore = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("documentUid")
    @Size(max = 64)
    private String documentUid = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails = null;

    @JsonProperty("documentName")
    private String documentName = null;

    @JsonProperty("isActive")
    private Boolean isActive = true;

}
