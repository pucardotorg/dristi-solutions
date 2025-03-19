package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.validation.annotation.Validated;

@EqualsAndHashCode(callSuper = true)
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class JoinCaseLitigant extends Party{

    @JsonProperty("isPip")
    private Boolean isPip = false;

}
