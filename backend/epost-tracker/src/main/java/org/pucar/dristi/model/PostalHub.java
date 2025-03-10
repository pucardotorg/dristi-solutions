package org.pucar.dristi.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.*;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

@Schema(description = "postal hub data to be fetched from mdms")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:11.072458+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class PostalHub {

    @JsonProperty("id")
    @Valid
    private String id = null;

    @JsonProperty("postHubName")
    @Valid
    private String postHubName = null;

    @JsonProperty("pinCodes")
    @Valid
    private List<String> pinCodes = new ArrayList<>();

}
