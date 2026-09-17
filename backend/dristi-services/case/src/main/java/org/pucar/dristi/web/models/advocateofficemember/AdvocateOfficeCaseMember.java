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
public class AdvocateOfficeCaseMember {

    @JsonProperty("id")
    private UUID id;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("officeAdvocateId")
    private UUID officeAdvocateId;

    @JsonProperty("officeAdvocateName")
    private String officeAdvocateName;

    @JsonProperty("officeAdvocateUserUuid")
    private String officeAdvocateUserUuid;

    @JsonProperty("caseId")
    private UUID caseId;

    @JsonProperty("memberId")
    private UUID memberId;

    @JsonProperty("memberUserUuid")
    private String memberUserUuid;

    @JsonProperty("memberType")
    private MemberType memberType;

    @JsonProperty("memberName")
    private String memberName;

    @JsonProperty("isActive")
    private Boolean isActive;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;

}
