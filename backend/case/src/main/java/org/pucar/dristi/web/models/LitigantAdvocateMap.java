package org.pucar.dristi.web.models;


import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Validated
public class LitigantAdvocateMap {

    @JsonProperty("litigantId")
    private String litigantId;

    @JsonProperty("advocateId")
    private List<String> advocateId;

    @JsonProperty("advocateCount")
    @Min(value = 0, message = "advocateCount must be greater than equal to 0")
    private Integer advocateCount;
}