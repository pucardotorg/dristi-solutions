package org.pucar.dristi.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import org.springframework.validation.annotation.Validated;

@Schema(description = "postal hub and related user name data to be fetched from mdms")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:11.072458+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class PostalHubUserName {

    @JsonProperty("userName")
    private String userName = null;

    @JsonProperty("postHubName")
    private String postHubName = null;

}
