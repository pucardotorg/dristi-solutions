package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdvocateOfficeMember {

    @JsonProperty("id")
    private String id;

    @JsonProperty("memberUserUuid")
    private String memberUserUuid;

    @JsonProperty("memberName")
    private String memberName;

    @JsonProperty("memberType")
    private MemberType memberType;

    @JsonProperty("advocateId")
    private String advocateId;

    @JsonProperty("clerkId")
    private String clerkId;

    @JsonProperty("isActive")
    private Boolean isActive;

    @JsonProperty("additionalDetails")
    private Object additionalDetails;
}
