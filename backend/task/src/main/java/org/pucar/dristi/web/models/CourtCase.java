package org.pucar.dristi.web.models;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Case registry
 */
@Schema(description = "Case registry")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-15T11:31:40.281899+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CourtCase {

    @JsonProperty("id")
    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    @NotNull
    //@Size(min = 2, max = 64)
    private String tenantId = null;

    @JsonProperty("resolutionMechanism")
    //@Size(min = 2, max = 128)
    private String resolutionMechanism = null;

    @JsonProperty("caseTitle")
    //@Size(min = 2, max = 512)
    private String caseTitle = null;

    @JsonProperty("isActive")
    private Boolean isActive = true;

    @JsonProperty("caseDescription")
    //@Size(min = 2, max = 10000)
    private String caseDescription = null;

    @JsonProperty("filingNumber")
    //@Size(min = 2, max = 64)
    private String filingNumber = null;

    @JsonProperty("advocateCount")
    private Integer advocateCount = null;

    @JsonProperty("courtCaseNumber")
    //@Size(min=10,max=24)
    private String courtCaseNumber = null;

    @JsonProperty("caseNumber")

    //@Size(min = 2, max = 32)
    private String caseNumber = null;

    @JsonProperty("caseType")
    private String caseType = null;

    @JsonProperty("cnrNumber")
    //@Size(min = 2, max = 32)
    private String cnrNumber = null;

    @JsonProperty("cmpNumber")
    private String cmpNumber = null;

    @JsonProperty("accessCode")
    private String accessCode = null;

    @JsonProperty("outcome")
    private String outcome = null;

    @JsonProperty("pendingAdvocateRequest")
    private List<PendingAdvocateRequest> pendingAdvocateRequests;

    @JsonProperty("courtId")
    //@Size(min = 2, max = 64)
    private String courtId = null;

    @JsonProperty("benchId")
    //@Size(min = 2, max = 64)
    private String benchId = null;

    @JsonProperty("filingDate")
    //@NotNull
    @Valid
    private Long filingDate = null;

    @JsonProperty("registrationDate")
    private Long registrationDate = null;

    @JsonProperty("judgementDate")
    private Long judgementDate = null;

    @JsonProperty("caseDetails")
    private Object caseDetails = null;

    @JsonProperty("caseCategory")
    //@NotNull
    //@Size(min = 2, max = 64)
    private String caseCategory = null;

    @JsonProperty("judgeId")
    private String judgeId = null;

    @JsonProperty("stage")
    private String stage = null;

    @JsonProperty("substage")
    private String substage = null;

    @JsonProperty("natureOfPleading")
    //@Size(min = 2, max = 64)
    private String natureOfPleading = null;

    @JsonProperty("litigants")
    //@NotNull
    @Valid
    //@Size(min = 2) //FIX
    private List<Party> litigants = new ArrayList<>();

    @JsonProperty("representatives")
    @Valid
    private List<AdvocateMapping> representatives = new ArrayList<>();

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("documents")
    @Valid
    private List<Document> documents = new ArrayList<>();

    @JsonProperty("remarks")
    private String remarks = null;

    @JsonProperty("workflow")
    @Valid
    private WorkflowObject workflow = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditdetails = null;

    @JsonProperty("poaHolders")
    @Valid
    private List<POAHolder> poaHolders = new ArrayList<>();

}
