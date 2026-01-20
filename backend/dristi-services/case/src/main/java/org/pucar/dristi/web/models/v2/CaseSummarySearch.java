package org.pucar.dristi.web.models.v2;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.pucar.dristi.web.models.NatureOfDisposal;
import org.pucar.dristi.web.models.POAHolder;
import org.pucar.dristi.web.models.StatuteSection;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseSummarySearch {

    @JsonProperty("id")
    private UUID id = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("resolutionMechanism")
    private String resolutionMechanism = null;

    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("createdTime")
    private Long createdTime;

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

    @JsonProperty("outcome")
    private String outcome = null;

    @JsonProperty("natureOfDisposal")
    private NatureOfDisposal natureOfDisposal = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("benchId")
    private String benchId = null;

    @JsonProperty("filingDate")
    private Long filingDate = null;

    @JsonProperty("registrationDate")
    private Long registrationDate = null;

    @JsonProperty("judgementDate")
    private Long judgementDate = null;

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

    @JsonProperty("statutesAndSection")
    private StatuteSectionV2 statutesAndSection = null;

    @JsonProperty("litigants")
    private List<LitigantV2> litigants = new ArrayList<>();

    @JsonProperty("representatives")
    private List<RepresentativeV2> representatives = new ArrayList<>();

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("remarks")
    private String remarks = null;

    @JsonProperty("createdBy")
    private String createdBy = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("advocateStatus")
    private String advocateStatus = null;

    @JsonProperty("poaHolders")
    private List<POAHolderV2> poaHolders = new ArrayList<>();
}
