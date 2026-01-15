package org.egov.infra.indexer.custom.hearing;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:11.072458+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class Attendee {
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

