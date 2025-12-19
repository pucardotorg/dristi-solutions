package org.egov.transformer.models.digitalized_document;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

/**
 * Details captured for recording plea of the accused.
 */
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

    @JsonProperty("caste")
    private String caste = null;

    @JsonProperty("calling")
    private String calling = null;

    @JsonProperty("religion")
    private String religion = null;

    @JsonProperty("age")
    private Integer age = null;

    @JsonProperty("isChargesUnderstood")
    private Boolean isChargesUnderstood = null;

    @JsonProperty("pleadGuilty")
    private Boolean pleadGuilty = null;

    @JsonProperty("magistrateRemarks")
    private String magistrateRemarks = null;

}
