package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.pucar.dristi.web.models.enums.MemberType;
import org.springframework.validation.annotation.Validated;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdvocateOfficeMember {

    @JsonProperty("memberId")
    private String memberId = null;

    @JsonProperty("memberName")
    private String memberName = null;

    @JsonProperty("memberType")
    private MemberType memberType = null;

    @JsonProperty("isActive")
    private Boolean isActive = null;
}
