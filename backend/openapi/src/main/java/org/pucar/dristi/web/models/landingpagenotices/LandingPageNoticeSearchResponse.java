package org.pucar.dristi.web.models.landingpagenotices;

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
public class LandingPageNoticeSearchResponse {

    @JsonProperty("LandingPageNotices")
    private List<LandingPageNotice> landingPageNotices;

    @JsonProperty("totalCount")
    private long totalCount;

    @JsonProperty("page")
    private Integer page;

    @JsonProperty("size")
    private Integer size;

}
