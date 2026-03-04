package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;

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
    @NotNull
    private String tenantId;

    @JsonProperty("caseNumber")
    @NotNull
    private String caseNumber;

    @JsonProperty("caseTitle")
    @NotNull
    private String caseTitle;

    @JsonProperty("filingNumber")
    @NotNull
    private String filingNumber;

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

    @JsonProperty("caseBundleNodes")
    private List<CaseBundleNode> caseBundleNodes;

    @JsonProperty("totalPages")
    private Integer totalPages;

    @JsonProperty("status")
    private String status;

    @JsonProperty("judgeComments")
    private String judgeComments;

    @JsonProperty("workflow")
    private WorkflowObject workflow;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;
}
