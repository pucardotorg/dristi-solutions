package org.egov.inbox.web.model.V2;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class OrPath {

    @JsonProperty("path")
    private String path;

    @JsonProperty("nestedPath")
    private String nestedPath;
}
