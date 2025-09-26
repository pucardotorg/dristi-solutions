package org.egov.user.web.contract;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.user.domain.model.Role;

@Getter
@Builder
@AllArgsConstructor
@Data
@NoArgsConstructor
@EqualsAndHashCode(of = {"code", "tenantId", "courtId"})
public class RoleRequest {

    private String code;
    private String name;
    private String tenantId;
    @JsonProperty("courtId")
    private String courtId;

    public RoleRequest(Role domainRole) {
        this.code = domainRole.getCode();
        this.name = domainRole.getName();
        this.tenantId = domainRole.getTenantId();
        this.courtId = domainRole.getCourtId();
    }

    public Role toDomain() {
        return Role.builder()
                .code(code)
                .name(name)
                .tenantId(tenantId)
                .courtId(courtId)
                .build();
    }
}
