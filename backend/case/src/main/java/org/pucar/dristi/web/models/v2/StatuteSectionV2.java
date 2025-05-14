package org.pucar.dristi.web.models.v2;

import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Holds the statute ID and the corresponding section &amp; subsections
 * applicable to the case.
 */
@Schema(description = "Holds the statute ID and the corresponding section & subsections applicable to the case. ")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-15T11:31:40.281899+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StatuteSectionV2 {

    @JsonProperty("section")
    private String section = null;

    @JsonProperty("subsection")
    private String subsection = null;

}
