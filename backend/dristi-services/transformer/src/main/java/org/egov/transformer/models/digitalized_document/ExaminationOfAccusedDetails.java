package org.egov.transformer.models.digitalized_document;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

/**
 * Details captured during examination of the accused.
 */
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
