package org.pucar.dristi.web.models.advocateofficemember;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.pucar.dristi.web.models.enums.MemberType;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AddMember {

    @JsonProperty("id")
    private UUID id;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("officeAdvocateId")
    private UUID officeAdvocateId;

    @JsonProperty("memberType")
    private MemberType memberType;

    @JsonProperty("memberId")
    private UUID memberId;

    @JsonProperty("memberName")
    private String memberName;

    @JsonProperty("memberMobileNumber")
    private String memberMobileNumber;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;

    @JsonProperty("isActive")
    private Boolean isActive;
}
