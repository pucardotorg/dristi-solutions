package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;

/**
 * CaseRequest
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-05-17T10:19:47.222225+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseRequest {
	@JsonProperty("RequestInfo")

	@Valid
	private RequestInfo requestInfo = null;

	@JsonProperty("caseId")

	private String caseId = null;

	@JsonProperty("filingNumber")

	private String filingNumber = null;

	@JsonProperty("caseNumber")

	private String caseNumber = null;

	@JsonProperty("tenantId")
	private String tenantId = null;

	@JsonProperty("pagination")
	@Valid
	private Pagination pagination = null;
}
