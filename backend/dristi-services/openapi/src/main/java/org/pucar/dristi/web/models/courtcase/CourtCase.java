package org.pucar.dristi.web.models.courtcase;

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
import java.util.UUID;


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
    private String tenantId = null;

    @JsonProperty("resolutionMechanism")
    private String resolutionMechanism = null;

    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("isActive")
    private Boolean isActive = true;

    @JsonProperty("caseDescription")
    private String caseDescription = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("advocateCount")
    private Integer advocateCount = null;

    @JsonProperty("courtCaseNumber")
    private String courtCaseNumber = null;

    @JsonProperty("caseNumber")
    private String caseNumber = null;

    @JsonProperty("caseType")
    private String caseType = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("cmpNumber")
    private String cmpNumber = null;

    @JsonProperty("accessCode")
    private String accessCode = null;

    @JsonProperty("outcome")
    private String outcome = null;

    @JsonProperty("pendingAdvocateRequests")
    private List<Object> pendingAdvocateRequests;

    @JsonProperty("courtId")
    //@Size(min = 2, max = 64)
    private String courtId = null;

    @JsonProperty("benchId")
    //@Size(min = 2, max = 64)
    private String benchId = null;

    @JsonProperty("linkedCases")
    @Valid
    private List<Object> linkedCases = new ArrayList<>();

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

    @JsonProperty("stageBackup")
    private String stageBackup = null;

    @JsonProperty("substage")
    private String substage = null;

    @JsonProperty("substageBackup")
    private String substageBackup = null;

    @JsonProperty("natureOfPleading")
    //@Size(min = 2, max = 64)
    private String natureOfPleading = null;

    @JsonProperty("statutesAndSections")
    //@NotNull
    @Valid
    private List<Object> statutesAndSections = new ArrayList<>();

    @JsonProperty("litigants")
    //@NotNull
    @Valid
    //@Size(min = 2) //FIX
    private List<Object> litigants = new ArrayList<>();

    @JsonProperty("representatives")
    @Valid
    private List<AdvocateMapping> representatives = new ArrayList<>();

    @JsonProperty("advocateOffices")
    @Valid
    private List<AdvocateOffice> advocateOffices = new ArrayList<>();

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("documents")
    @Valid
    private List<Object> documents = new ArrayList<>();

    @JsonProperty("remarks")
    private String remarks = null;

    @JsonProperty("workflow")
    @Valid
    private Object workflow = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditdetails = null;

    @JsonProperty("advocateStatus")
    private String advocateStatus = null;


    @JsonProperty("poaHolders")
    @Valid
    private List<Object> poaHolders = new ArrayList<>();

    @JsonProperty("lprNumber")
    private String lprNumber = null;

    @JsonProperty("isLPRCase")
    private Boolean isLPRCase = false;

    @JsonProperty("courtCaseNumberBackup")
    private String courtCaseNumberBackup = null;

}
