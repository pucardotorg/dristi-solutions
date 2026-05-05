package org.pucar.dristi.web.models.taskManagement;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Coordinates {

    @JsonProperty("latitude")
    private  String latitude;

    @JsonProperty("longitude")
    private String longitude;
}
