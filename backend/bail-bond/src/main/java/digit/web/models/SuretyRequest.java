package digit.web.models;


import com.fasterxml.jackson.annotation.JsonProperty;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * SuretyRequest
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-07-01T18:23:09.143185454+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SuretyRequest {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("surety")
    @Valid
    private Surety surety = null;


}

