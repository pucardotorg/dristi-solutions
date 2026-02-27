package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Workflow;

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
    private Boolean isPartyToCase;
    
    @JsonProperty("partyDesignation")
    private String partyDesignation;
    
    @JsonProperty("affidavitDocument")
    private Document affidavitDocument;
    
    @JsonProperty("selectedDocuments")
    private List<SelectedDocument> selectedDocuments;
    
    @JsonProperty("totalPages")
    private Integer totalPages;
    
    @JsonProperty("status")
    private String status;
    
    @JsonProperty("judgeComments")
    private String judgeComments;
    
    @JsonProperty("issuedDocuments")
    private List<IssuedDocument> issuedDocuments;
    
    @JsonProperty("workflow")
    private WorkflowObject workflow;
    
    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;
}
