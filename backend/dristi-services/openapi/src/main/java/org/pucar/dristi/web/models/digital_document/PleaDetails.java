package org.pucar.dristi.web.models.digital_document;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

/**
 * Details captured for recording plea of the accused.
 */
@Schema(description = "Details captured for recording plea of the accused.")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-11-25T18:36:45.881826585+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PleaDetails {

    @JsonProperty("accusedName")
    private String accusedName = null;

    @JsonProperty("accusedUniqueId")
    private String accusedUniqueId = null;

    @JsonProperty("fatherName")
    private String fatherName = null;

    @JsonProperty("village")
    private String village = null;

    @JsonProperty("taluk")
    private String taluk = null;

    @JsonProperty("calling")
    private String calling = null;

    @JsonProperty("age")
    private Integer age = null;

    @JsonProperty("isChargesUnderstood")
    private Boolean isChargesUnderstood = null;

    @JsonProperty("pleadGuilty")
    private Boolean pleadGuilty = null;

    @JsonProperty("magistrateRemarks")
    private String magistrateRemarks = null;

    @JsonProperty("accusedMobileNumber")
    private String accusedMobileNumber = null;

}
