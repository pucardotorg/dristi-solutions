package org.pucar.dristi.web.models.v2;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.pucar.dristi.web.models.NatureOfDisposal;
import org.pucar.dristi.web.models.PendingAdvocateRequest;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseSummaryList {

    @JsonProperty("id")
    private String id;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("createdTime")
    private Long createdTime;

    @JsonProperty("caseTitle")
    private String caseTitle;

    @JsonProperty("filingDate")
    private Long filingDate;

    @JsonProperty("caseType")
    private String caseType;

    @JsonProperty("caseNumber")
    private String caseNumber;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("outcome")
    private String outcome;

    @JsonProperty("natureOfDisposal")
    private NatureOfDisposal natureOfDisposal;

    @JsonProperty("substage")
    private String substage;

    @JsonProperty("cmpNumber")
    private String cmpNumber;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("status")
    private String status;

    @JsonProperty("courtCaseNumber")
    private String courtCaseNumber;

    @JsonProperty("cnrNumber")
    private String cnrNumber;

    @JsonProperty("lastModifiedTime")
    private Long lastModifiedTime;

    @JsonProperty("pendingAdvocateRequests")
    private List<PendingAdvocateRequest> pendingAdvocateRequests;

    @JsonProperty("advocateStatus")
    private String advocateStatus;

    @JsonProperty("lprNumber")
    private String lprNumber = null;

    @JsonProperty("isLPRCase")
    private Boolean isLPRCase = false;
}
