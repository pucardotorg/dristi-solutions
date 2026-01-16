package org.egov.transformer.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.springframework.validation.annotation.Validated;

@EqualsAndHashCode(callSuper = true)
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Representing extends Party {

    @JsonProperty("isAdvocateReplacing")
    private boolean isAdvocateReplacing = false;
}

