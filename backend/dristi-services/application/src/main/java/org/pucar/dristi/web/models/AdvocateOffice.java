package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdvocateOffice {

    @JsonProperty("officeAdvocateId")
    private String officeAdvocateId;

    @JsonProperty("officeAdvocateName")
    private String officeAdvocateName;

    @JsonProperty("officeAdvocateUserUuid")
    private String officeAdvocateUserUuid;

    @JsonProperty("advocates")
    private List<AdvocateOfficeMember> advocates;

    @JsonProperty("clerks")
    private List<AdvocateOfficeMember> clerks;
}
