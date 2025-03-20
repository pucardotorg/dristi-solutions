package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.springframework.validation.annotation.Validated;

@EqualsAndHashCode(callSuper = true)
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public class JoinCaseLitigant extends Party{

    @JsonProperty("isPip")
    private Boolean isPip = false;

}
