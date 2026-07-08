package org.egov.transformer.models;

import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CaseMeta
 *
 * Lightweight scalar projection of a court case returned by the case service
 * case/v1/casemeta/_search endpoint. Sourced directly from the dristi_cases table
 * (always fresh, no Redis, no decryption).
 */
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseMeta {

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("courtCaseNumber")
    private String courtCaseNumber = null;

    @JsonProperty("cmpNumber")
    private String cmpNumber = null;

    @JsonProperty("lprNumber")
    private String lprNumber = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("lifecycleStatus")
    private LifecycleStatus lifecycleStatus = null;

    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("stage")
    private String stage = null;

    @JsonProperty("filingDate")
    private Long filingDate = null;

    @JsonProperty("registrationDate")
    private Long registrationDate = null;

}
