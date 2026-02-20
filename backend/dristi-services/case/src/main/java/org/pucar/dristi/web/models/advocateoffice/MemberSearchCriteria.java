package org.pucar.dristi.web.models.advocateoffice;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.pucar.dristi.web.models.enums.MemberType;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MemberSearchCriteria {

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId;

    @JsonProperty("officeAdvocateUserUuid")
    @Valid
    private UUID officeAdvocateUserUuid;

    @JsonProperty("officeAdvocateId")
    @Valid
    private UUID officeAdvocateId;

    @JsonProperty("memberType")
    private MemberType memberType;

    @JsonProperty("memberName")
    private String memberName;

    @JsonProperty("memberMobileNumber")
    private String memberMobileNumber;

    @JsonProperty("memberUserUuid")
    @Valid
    private UUID memberUserUuid;

    @JsonProperty("memberId")
    @Valid
    private UUID memberId;

    @JsonProperty("isActive")
    private Boolean isActive;
}
