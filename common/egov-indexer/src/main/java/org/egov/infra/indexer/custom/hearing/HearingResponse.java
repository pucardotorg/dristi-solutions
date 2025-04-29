package org.egov.infra.indexer.custom.hearing;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:11.072458+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class HearingResponse   {
    @JsonProperty("responseInfo")

    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("TotalCount")

    private Integer totalCount = null;

    @JsonProperty("HearingList")
    @Valid
    private List<Hearing> hearingList = null;


    public HearingResponse addHearingListItem(Hearing hearingListItem) {
        if (this.hearingList == null) {
            this.hearingList = new ArrayList<>();
        }
        this.hearingList.add(hearingListItem);
        return this;
    }

}
