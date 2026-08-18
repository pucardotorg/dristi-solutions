package org.pucar.dristi.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EPostTrackerPdf {


    @JsonProperty("totalAmount")
    @Valid
    private String totalAmount;

    @JsonProperty("totalBookedPost")
    @Valid
    private Integer totalBookedPost;

    @JsonProperty("courtName")
    @Valid
    private String courtName;

    @JsonProperty("monthlyReportYear")
    @Valid
    private String monthlyReportYear;

    @JsonProperty("reportMonthName")
    @Valid
    private String reportMonthName;

    @JsonProperty("generatedDateTime")
    @Valid
    private String generatedDateTime;

}
