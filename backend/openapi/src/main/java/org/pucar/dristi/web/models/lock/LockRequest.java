package org.pucar.dristi.web.models.lock;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LockRequest {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("Lock")
    @Valid
    private Lock lock = null;


}
