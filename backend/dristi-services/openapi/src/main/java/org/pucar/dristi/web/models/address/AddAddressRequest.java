package org.pucar.dristi.web.models.address;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.UUID;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AddAddressRequest {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("caseId")
    private UUID caseId;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("partyAddresses")
    private List<PartyAddressRequest> partyAddresses;
}
