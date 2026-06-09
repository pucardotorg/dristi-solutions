package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;

import java.util.List;


@Schema(description = "This object holds information about the bulk hearing update request")
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class HearingUpdateBulkRequest {
    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo;

    @JsonProperty("hearings")
    @Valid
    private List<Hearing> hearings;
}
