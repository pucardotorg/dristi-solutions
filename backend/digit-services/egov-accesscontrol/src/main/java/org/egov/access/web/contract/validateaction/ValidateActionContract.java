package org.egov.access.web.contract.validateaction;

import lombok.*;

import jakarta.validation.Valid;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ValidateActionContract {
	@NonNull
	@Valid
	private TenantRoleContract tenantRole;

	@NonNull
	private String actionUrl;
}
