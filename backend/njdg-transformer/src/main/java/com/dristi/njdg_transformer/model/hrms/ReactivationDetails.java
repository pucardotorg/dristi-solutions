package com.dristi.njdg_transformer.model.hrms;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;


@Validated
@EqualsAndHashCode(exclude = {"auditDetails"})
@AllArgsConstructor
@Getter
@NoArgsConstructor
@Setter
@ToString
@Builder
public class ReactivationDetails {

	
	private String id;

	
	@NotNull
	private String reasonForReactivation;

	
	private String orderNo;

	
	private String remarks;

	@NotNull
	private Long effectiveFrom;

	
	private String tenantId;

	private AuditDetails auditDetails;

}


