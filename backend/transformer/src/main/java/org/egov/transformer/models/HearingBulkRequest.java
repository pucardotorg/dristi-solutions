package org.egov.transformer.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

/**
 * This object holds information about the hearing request
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:11.072458+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class HearingBulkRequest {
    @JsonProperty("RequestInfo")

    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("hearings")

    @Valid
    private List<Hearing> hearing = new ArrayList<>();


}

