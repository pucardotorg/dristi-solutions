package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LitigantDetails {
    @NotNull
    @JsonProperty("name")
    private String name;

    @NotNull
    @JsonProperty("individualId")
    private String individualId;

    @NotNull
    @JsonProperty("partyType")
    private String partyType;

    @NotNull
    @JsonProperty("userUuid")
    private String userUuid;
}
