package org.pucar.dristi.web.models;

import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.egov.common.contract.request.RequestInfo;

/**
 * CaseBundleRequest
 */
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseBundlePdfRequest   {
    @JsonProperty("RequestInfo")

    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("index")
    @NonNull
    private Object index = null;

    @JsonProperty("caseNumber")
    @NotNull
    @Valid
    private String caseNumber = null;


}
