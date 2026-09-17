package org.pucar.dristi.web.models.advocateoffice;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.web.models.Pagination;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MemberSearchResponse {

    @JsonProperty("ResponseInfo")
    @Valid
    private ResponseInfo responseInfo;

    @JsonProperty("members")
    @Valid
    private List<OfficeMember> members;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination;

    @JsonProperty("totalCount")
    private Integer totalCount;

    public MemberSearchResponse addMembersItem(OfficeMember membersItem) {
        if (this.members == null) {
            this.members = new ArrayList<>();
        }
        this.members.add(membersItem);
        return this;
    }
}
