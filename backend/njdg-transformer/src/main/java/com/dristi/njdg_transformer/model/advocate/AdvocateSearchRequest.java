<<<<<<<< HEAD:backend/case/src/main/java/org/pucar/dristi/web/models/AdvocateSearchRequest.java
package org.pucar.dristi.web.models;

import java.util.ArrayList;
import java.util.List;

import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;
========
package com.dristi.njdg_transformer.model.advocate;
>>>>>>>> 01115c2f144c0cc67d9682d49ca6cefc20114f83:backend/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/advocate/AdvocateSearchRequest.java

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

/**
 * AdvocateSearchRequest
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-04T05:55:27.937918+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdvocateSearchRequest {
	@JsonProperty("RequestInfo")
<<<<<<<< HEAD:backend/case/src/main/java/org/pucar/dristi/web/models/AdvocateSearchRequest.java
	@javax.validation.Valid
========
>>>>>>>> 01115c2f144c0cc67d9682d49ca6cefc20114f83:backend/njdg-transformer/src/main/java/com/dristi/njdg_transformer/model/advocate/AdvocateSearchRequest.java
	private RequestInfo requestInfo = null;

	@JsonProperty("tenantId")
	private String tenantId = null;

	@JsonProperty("criteria")
	@Valid
	private List<AdvocateSearchCriteria> criteria = new ArrayList<>();

	public AdvocateSearchRequest addCriteriaItem(AdvocateSearchCriteria criteriaItem) {
		this.criteria.add(criteriaItem);
		return this;
	}

}
