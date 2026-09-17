package org.pucar.dristi.web.models;

import java.util.ArrayList;
import java.util.List;

import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CaseMetaRequest
 *
 * Batch-friendly request for the lightweight case-metadata projection. Resolves one
 * or more filingNumbers to their scalar case metadata.
 */
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseMetaRequest {

	@JsonProperty("RequestInfo")
	@Valid
	private RequestInfo requestInfo = null;

	@JsonProperty("tenantId")
	private String tenantId = null;

	@JsonProperty("filingNumbers")
	@NotEmpty
	private List<String> filingNumbers = new ArrayList<>();

}
