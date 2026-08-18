package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.Getter;
import lombok.Setter;
import org.springframework.validation.annotation.Validated;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-15T11:31:40.281899+05:30[Asia/Kolkata]")
@Getter
@Setter
public class TemplateConfigurationCriteria {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("searchableText")
    private String searchableText = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("courtId")
    private String courtId = null;

}