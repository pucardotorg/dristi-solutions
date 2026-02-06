package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Attendee {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("name")

    private String name = null;

    @JsonProperty("individualId")

    private String individualId = null;

    @JsonProperty("type")

    private String type = null;

    @JsonProperty("associatedWith")

    private String associatedWith = null;

    @JsonProperty("wasPresent")

    private Boolean wasPresent = null;

    @JsonProperty("isOnline")

    private Boolean isOnline = null;

}
