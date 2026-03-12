package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CtcApplication {

    @JsonProperty("id")
    private String id;

    @JsonProperty("ctcApplicationNumber")
    private String ctcApplicationNumber;

    @JsonProperty("tenantId")
    @Valid
    @NotNull
    private String tenantId;

    @JsonProperty("caseNumber")
    @Valid
    @NotNull
    private String caseNumber;

    @JsonProperty("caseTitle")
    @NotNull
    private String caseTitle;

    @JsonProperty("filingNumber")
    @NotNull
    private String filingNumber;

    @JsonProperty("cnrNumber")
    @NotNull
    private String cnrNumber;

    @JsonProperty("courtId")
    @NotNull
    private String courtId;

    @JsonProperty("applicantName")
    @NotNull
    private String applicantName;

    @JsonProperty("mobileNumber")
    @NotNull
    private String mobileNumber;

    @JsonProperty("isPartyToCase")
    @NotNull
    private Boolean isPartyToCase = false;

    @JsonProperty("partyDesignation")
    private String partyDesignation;

    @JsonProperty("affidavitDocument")
    private Document affidavitDocument;

    @JsonProperty("documents")
    private List<Document> documents;

    @JsonProperty("selectedCaseBundle")
    private List<CaseBundleNode> selectedCaseBundle = new ArrayList<>();

    @JsonProperty("caseBundles")
    private List<CaseBundleNode> caseBundles = new ArrayList<>();

    @JsonProperty("totalPages")
    private Integer totalPages;

    @JsonProperty("status")
    private String status;

    @JsonProperty("dateOfApplicationApproval")
    private Long dateOfApplicationApproval;

    @JsonProperty("judgeComments")
    private String judgeComments;

    @JsonProperty("workflow")
    private WorkflowObject workflow;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;
}
