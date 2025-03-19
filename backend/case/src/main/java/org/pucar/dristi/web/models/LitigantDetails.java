package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("name")
    private String name;

    @JsonProperty("individualId")
    private String individualId;

    @JsonProperty("partyType")
    private String partyType;

    @JsonProperty("userUuid")
    private String userUuid;

}
