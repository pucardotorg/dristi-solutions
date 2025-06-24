package org.egov.transformer.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDate;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseSearch {
    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("courtName")
    private String courtName = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("stNumber")
    private String stNumber = null;

    @JsonProperty("cmpNumber")
    private String cmpNumber = null;

    @JsonProperty("caseType")
    private String caseType = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

//    list of string
//    @JsonProperty("litigant")
//    private Litigant litigant = null;

    @JsonProperty("nextHearingDate")
    private LocalDate nextHearingDate = null;

    @JsonProperty("caseStage")
    private String caseStage = null;

    @JsonProperty("caseStatus")
    private String caseStatus = null;

    @JsonProperty("yearOfFiling")
    private String yearOfFiling = null;

    @JsonProperty("hearingType")
    private String hearingType = null;


    /*
    list
    advocate
        -- name
        -- barcode --- statecode case insensitive  /code / 	   year
        -- fone no
     */
}
