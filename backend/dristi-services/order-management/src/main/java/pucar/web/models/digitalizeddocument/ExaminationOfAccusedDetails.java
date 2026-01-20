package pucar.web.models.digitalizeddocument;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

/**
 * Details captured during examination of the accused.
 */
@Schema(description = "Details captured during examination of the accused.")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-11-25T18:36:45.881826585+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ExaminationOfAccusedDetails {

    @JsonProperty("accusedName")
    private String accusedName = null;

    @JsonProperty("accusedUniqueId")
    private String accusedUniqueId = null;

    @JsonProperty("examinationDescription")
    private String examinationDescription = null;

    @JsonProperty("accusedMobileNumber")
    private String accusedMobileNumber = null;


}
