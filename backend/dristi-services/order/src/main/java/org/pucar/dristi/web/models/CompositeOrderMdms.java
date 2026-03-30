package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.*;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;


@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:11.072458+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class CompositeOrderMdms {

    @JsonProperty("id")
    @Valid
    private String id = null;

    @JsonProperty("orderType")
    @Valid
    private String orderType = null;

    @JsonProperty("path")
    @Valid
    private String path = null;

    @JsonProperty("orderTypeList")
    @Valid
    private List<String> orderTypeList = new ArrayList<>();
}
