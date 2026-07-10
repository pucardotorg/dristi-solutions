package org.pucar.dristi.web.models;

import org.pucar.dristi.web.models.enums.LifecycleStatus;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CaseMeta
 *
 * Lightweight, scalar-only projection of a court case, sourced directly from the
 * dristi_cases table (single table, no joins) and served without Redis caching or
 * enc-service decryption. All fields here are plaintext identifiers/metadata.
 * Intended for internal callers that need case identifiers/scalars by filingNumber
 * without paying the cost of the full case _search.
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
