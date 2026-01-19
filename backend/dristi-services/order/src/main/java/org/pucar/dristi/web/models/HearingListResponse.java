package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class HearingListResponse   {
    @JsonProperty("responseInfo")

    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("TotalCount")

    private Integer totalCount = null;

    @JsonProperty("HearingList")
    @Valid
    private List<Hearing> hearingList = null;


    public HearingListResponse addHearingListItem(Hearing hearingListItem) {
        if (this.hearingList == null) {
            this.hearingList = new ArrayList<>();
        }
        this.hearingList.add(hearingListItem);
        return this;
    }

}
