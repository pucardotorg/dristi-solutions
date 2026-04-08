package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SampleEntityRequest {

    @JsonProperty("RequestInfo")
    @NotNull
    @Valid
    private RequestInfo requestInfo;

    @JsonProperty("sampleEntity")
    @NotNull
    @Valid
    private SampleEntity sampleEntity;
}
