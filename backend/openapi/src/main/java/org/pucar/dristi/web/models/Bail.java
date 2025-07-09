package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import lombok.Data;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

/**
 * Bail
 */
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Bail {

    @JsonProperty("id")
    private String id;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId;

    @JsonProperty("caseId")
    @NotNull
    private String caseId;

    @JsonProperty("bailAmount")
    private Double bailAmount;

    @JsonProperty("bailType")
    private BailType bailType;

    @JsonProperty("startDate")
    private Long startDate;

    @JsonProperty("endDate")
    private Long endDate;

    @JsonProperty("isActive")
    private Boolean isActive;

    @JsonProperty("litigantId")
    private String litigantId;

    @JsonProperty("litigantName")
    private String litigantName;

    @JsonProperty("litigantFatherName")
    private String litigantFatherName;

    @JsonProperty("litigantSigned")
    private Boolean litigantSigned;

    @JsonProperty("sureties")
    @Valid
    private List<Surety> sureties;

    @JsonProperty("shortenedURL")
    private String shortenedURL;

    @JsonProperty("documents")
    @Valid
    private List<Document> documents;

    @JsonProperty("additionalDetails")
    private Object additionalDetails;

    @JsonProperty("workflow")
    @Valid
    private WorkflowObject workflow;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("caseTitle")
    private String caseTitle;

    @JsonProperty("cnrNumber")
    private String cnrNumber;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("caseType")
    private CaseType caseType;

    @JsonProperty("bailId")
    private String bailId;

    @JsonProperty("status")
    @NotNull
    private String status;

    // Helper methods
    public Bail addSurety(Surety surety) {
        if (this.sureties == null) this.sureties = new ArrayList<>();
        this.sureties.add(surety);
        return this;
    }

    public Bail addDocumentsItem(Document documentsItem) {
        if (this.documents == null) this.documents = new ArrayList<>();
        this.documents.add(documentsItem);
        return this;
    }
}

