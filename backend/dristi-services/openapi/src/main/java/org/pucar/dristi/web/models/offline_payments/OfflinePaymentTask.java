package org.pucar.dristi.web.models.offline_payments;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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
public class OfflinePaymentTask {

    @JsonProperty("consumerCode")
    @Valid
    @NotNull
    private String consumerCode;

    @JsonProperty("filingNumber")
    @Valid
    @NotNull
    private String filingNumber;

    @JsonProperty("status")
    private StatusEnum status;

    @JsonProperty("tenantId")
    @Valid
    @NotNull
    private String tenantId;

}
