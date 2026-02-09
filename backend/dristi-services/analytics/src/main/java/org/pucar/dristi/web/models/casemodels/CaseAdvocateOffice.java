package org.pucar.dristi.web.models.casemodels;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.pucar.dristi.web.models.AdvocateOfficeMember;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseAdvocateOffice {

    @JsonProperty("officeAdvocateId")
    private String officeAdvocateId;

    @JsonProperty("officeAdvocateName")
    private String officeAdvocateName;

    @JsonProperty("officeAdvocateUserUuid")
    private String officeAdvocateUserUuid;

    @JsonProperty("advocates")
    @Builder.Default
    private List<AdvocateOfficeMember> advocates = new ArrayList<>();

    @JsonProperty("clerks")
    @Builder.Default
    private List<AdvocateOfficeMember> clerks = new ArrayList<>();
}
