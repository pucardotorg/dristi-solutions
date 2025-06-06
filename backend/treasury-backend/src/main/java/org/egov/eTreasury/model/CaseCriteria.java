package org.egov.eTreasury.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class CaseCriteria {


    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("defaultFields")
    private Boolean defaultFields = false;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("outcome")
    private List<String> outcome = null;

    @JsonProperty("courtCaseNumber")
    private String courtCaseNumber = null;

    @JsonProperty("caseSearchText")
    private String caseSearchText = null;

    @JsonProperty("filingFromDate")
    @Valid
    private Long filingFromDate = null;

    @JsonProperty("filingToDate")
    @Valid
    private Long filingToDate = null;

    @JsonProperty("registrationFromDate")
    @Valid
    private Long registrationFromDate = null;

    @JsonProperty("registrationToDate")
    @Valid
    private Long registrationToDate = null;
    //todo judgeid, stage, substage

    @JsonProperty("judgeId")
    private String judgeId = null;

    @JsonProperty("stage")
    private List<String> stage = null;

    @JsonProperty("substage")
    private String substage = null;

    @JsonProperty("litigantId")
    @Valid
    private String litigantId = null;

    @JsonProperty("advocateId")
    @Valid
    private String advocateId = null;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("status")
    @Valid
    private List<String> status = null;

    @JsonProperty("responseList")
    @Valid
    private List<CourtCase> responseList = null;


}


