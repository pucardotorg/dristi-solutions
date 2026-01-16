package org.pucar.dristi.web.models.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Payload {

    @JsonProperty("url")
    private String url;

    @JsonProperty("data")
    private String data;

    @JsonProperty("headers")
    private String headers;

    //grn for treasury mock
    @JsonProperty("grn")
    private String grn;
}
