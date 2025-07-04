package digit.web.models;

import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * Document
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-07-01T18:25:48.287360981+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Document {
    @JsonProperty("id")
    private String id = null;

    @JsonProperty("documentType")
    private String documentType = null;

    @JsonProperty("fileStore")
    private String fileStore = null;

    @JsonProperty("documentUid")
    private String documentUid = null;

    @JsonProperty("isActive")
    private Boolean isActive = true;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;


}
