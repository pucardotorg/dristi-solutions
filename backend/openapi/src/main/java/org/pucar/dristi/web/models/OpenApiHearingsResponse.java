package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class OpenApiHearingsResponse {

    @JsonProperty("openHearings")
    private List<OpenHearing> openHearings = null;

    @JsonProperty("totalCount")
    private Integer totalCount = null;

    @JsonProperty("pagination")
    private Pagination pagination = null;

}
