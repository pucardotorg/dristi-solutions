package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CauseListRequest {

    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;

    @NotBlank
    @JsonProperty("courtId")
    private String courtId;

    @NotBlank
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "date must be in yyyy-MM-dd format")
    @JsonProperty("date")
    private String date;

    @Min(0)
    @JsonProperty("offset")
    @Builder.Default
    private int offset = 0;

    @Min(1)
    @Max(300)
    @JsonProperty("limit")
    @Builder.Default
    private int limit = 100;
}
