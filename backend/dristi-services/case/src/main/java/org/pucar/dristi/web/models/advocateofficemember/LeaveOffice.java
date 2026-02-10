package org.pucar.dristi.web.models.advocateofficemember;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.pucar.dristi.web.models.enums.AccessType;
import org.pucar.dristi.web.models.enums.MemberType;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LeaveOffice {

    @JsonProperty("id")
    private UUID id;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("isActive")
    private Boolean isActive;

    @JsonProperty("officeAdvocateUserUuid")
    private UUID officeAdvocateUserUuid;

    @JsonProperty("officeAdvocateId")
    private UUID officeAdvocateId;

    @JsonProperty("officeAdvocateName")
    private String officeAdvocateName;

    @JsonProperty("memberType")
    private MemberType memberType;

    @JsonProperty("memberUserUuid")
    private UUID memberUserUuid;

    @JsonProperty("memberId")
    private UUID memberId;

    @JsonProperty("memberName")
    private String memberName;

    @JsonProperty("memberMobileNumber")
    private String memberMobileNumber;

    @JsonProperty("memberEmail")
    private String memberEmail;

    @JsonProperty("accessType")
    private AccessType accessType = AccessType.ALL_CASES;

    @JsonProperty("addNewCasesAutomatically")
    private Boolean addNewCasesAutomatically;

    @JsonProperty("allowCaseCreate")
    private Boolean allowCaseCreate;


    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;

}
