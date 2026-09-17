package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MemberSearchCriteria {

    @JsonProperty("officeAdvocateId")
    @Valid
    private UUID officeAdvocateId = null;

    @JsonProperty("memberId")
    @Valid
    private UUID memberId = null;

    @JsonProperty("memberType")
    private String memberType = null;

    @JsonProperty("tenantId")
    private String tenantId = null;
}
