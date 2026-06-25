package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.validation.annotation.Validated;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:11.072458+05:30[Asia/Calcutta]")
@Getter
@Setter
public class CompositeItem {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("orderType")
    private String  orderType = null;

    @JsonProperty("orderSchema")
    private Object orderSchema = null;

}
