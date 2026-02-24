package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

/**
 * Bank details.
 */
@Schema(description = "Bank details.")
@Validated
@javax.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2026-02-19T19:24:10.916325138+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BankDetails {

    @JsonProperty("name")
    private String name = null;

    @JsonProperty("branch")
    private String branch = null;

    @JsonProperty("ifsc")
    private String ifsc = null;


}
