package digit.web.models;

import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import digit.web.models.Document;
import digit.web.models.Workflow;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * Bail
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-07-01T18:25:48.287360981+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Bail {
    @JsonProperty("id")

    private String id = null;

    @JsonProperty("tenantId")
    @NotNull

    private String tenantId = null;

    @JsonProperty("caseId")
    @NotNull

    private String caseId = null;

    @JsonProperty("bailAmount")

    private Double bailAmount = null;

    @JsonProperty("bailType")

    private String bailType = null;

    @JsonProperty("status")

    private String status = null;

    @JsonProperty("startDate")

    @Valid
    private Long startDate = null;

    @JsonProperty("endDate")

    @Valid
    private Long endDate = null;

    @JsonProperty("isActive")

    private Boolean isActive = null;

    @JsonProperty("accusedId")

    private String accusedId = null;

    @JsonProperty("advocateId")

    private String advocateId = null;

    @JsonProperty("suretyIds")

    private List<String> suretyIds = null;

    @JsonProperty("documents")
    @Valid
    private List<Document> documents = null;

    @JsonProperty("additionalDetails")

    private Object additionalDetails = null;

    @JsonProperty("auditDetails")

    @Valid
    private AuditDetails auditDetails = null;

    @JsonProperty("workflow")
    @Valid
    private WorkflowObject workflow = null;


    public Bail addSuretyIdsItem(String suretyIdsItem) {
        if (this.suretyIds == null) {
            this.suretyIds = new ArrayList<>();
        }
        this.suretyIds.add(suretyIdsItem);
        return this;
    }

    public Bail addDocumentsItem(Document documentsItem) {
        if (this.documents == null) {
            this.documents = new ArrayList<>();
        }
        this.documents.add(documentsItem);
        return this;
    }

}
