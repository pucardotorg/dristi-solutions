package org.pucar.dristi.web.models.landingpagenotices;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LandingPageNoticeResponse {

    @JsonProperty("ResponseInfo")
    private ResponseInfo responseInfo;

    @JsonProperty("LandingPageNotice")
    private LandingPageNotice landingPageNotice;

    @JsonProperty("LandingPageNotices")
    private List<LandingPageNotice> landingPageNotices;

    @JsonProperty("totalCount")
    private Integer totalCount;

    @JsonProperty("page")
    private Integer page;

    @JsonProperty("size")
    private Integer size;

}
