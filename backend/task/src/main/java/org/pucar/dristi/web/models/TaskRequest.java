package org.pucar.dristi.web.models;

import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;

import lombok.*;
import org.egov.common.contract.request.RequestInfo;

import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;

/**
 * TaskRequest
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:50.003326400+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskRequest   {

        @JsonProperty("orderId")
        @Valid
        private UUID orderId = null;

        @JsonProperty("RequestInfo")
        @Valid
        private RequestInfo requestInfo = null;

        @JsonProperty("task")
        @Valid
        private Task task = null;

}
