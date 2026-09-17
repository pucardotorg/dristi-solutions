package org.pucar.dristi.web.models.advocateofficemember;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.pucar.dristi.web.models.enums.MemberType;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessCaseMember {

    @JsonProperty("addCaseIds")
    private List<String> addCaseIds;

    @JsonProperty("removeCaseIds")
    private List<String> removeCaseIds;

    @JsonProperty("officeAdvocateUserUuid")
    private UUID officeAdvocateUserUuid;

    @JsonProperty("memberUserUuid")
    private UUID memberUserUuid;

    @JsonProperty("officeAdvocateId")
    private UUID officeAdvocateId;

    @JsonProperty("memberId")
    private UUID memberId;

    @JsonProperty("officeAdvocateName")
    private String officeAdvocateName;

    @JsonProperty("memberType")
    private MemberType memberType;

    @JsonProperty("memberName")
    private String memberName;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;
}
