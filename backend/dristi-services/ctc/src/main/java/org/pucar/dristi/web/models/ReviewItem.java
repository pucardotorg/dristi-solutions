package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewItem {

    @JsonProperty("ctcApplicationNumber")
    @NotBlank
    private String ctcApplicationNumber;

    @JsonProperty("filingNumber")
    @NotBlank
    private String filingNumber;

    @JsonProperty("comments")
    private String comments;

}
