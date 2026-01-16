package org.egov.eTreasury.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.models.Workflow;


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

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("benchId")
    private String benchId = null;

    @JsonProperty("linkedCases")
    @Valid
    private List<LinkedCase> linkedCases = new ArrayList<>();

    @JsonProperty("filingDate")
    @Valid
    private Long filingDate = null;

    @JsonProperty("registrationDate")
    private Long registrationDate = null;

    @JsonProperty("judgementDate")
    private Long judgementDate = null;

    @JsonProperty("caseDetails")
    private Object caseDetails = null;

    @JsonProperty("caseCategory")
    private String caseCategory = null;

    @JsonProperty("judgeId")
    private String judgeId = null;

    @JsonProperty("stage")
    private String stage = null;

    @JsonProperty("substage")
    private String substage = null;

    @JsonProperty("natureOfPleading")
    private String natureOfPleading = null;

    @JsonProperty("statutesAndSections")
    @Valid
    private List<StatuteSection> statutesAndSections = new ArrayList<>();

    @JsonProperty("litigants")
    @Valid
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
    private Workflow workflow = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditdetails = null;

    @JsonProperty("poaHolders")
    @Valid
    private List<POAHolder> poaHolders = new ArrayList<>();
}
