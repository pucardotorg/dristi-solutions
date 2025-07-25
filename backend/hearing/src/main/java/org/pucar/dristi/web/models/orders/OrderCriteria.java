package org.pucar.dristi.web.models.orders;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.validation.annotation.Validated;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-15T11:31:40.281899+05:30[Asia/Kolkata]")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCriteria {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("applicationNumber")
    private String applicationNumber = null;

    @JsonProperty("orderType")
    private String orderType = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("orderNumber")
    private String orderNumber = null;

    @JsonProperty("orderCategory")
    private String orderCategory = null;

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("hearingNumber")
    private String hearingNumber = null;

}