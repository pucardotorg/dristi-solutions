package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class JoinCasePaymentTaskRequest {

    @JsonProperty("joinCaseRequest")
    private JoinCaseTaskRequest joinCaseRequest;

    @JsonProperty("paymentBreakUp")
    private Object paymentBreakUp;

    @JsonProperty("advocateUuid")
    private String advocateUuid;

    @JsonProperty("consumerCode")
    private String consumerCode;

}
