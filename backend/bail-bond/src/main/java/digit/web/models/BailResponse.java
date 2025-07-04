package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;

import org.egov.common.contract.response.ResponseInfo;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * BailResponse
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-07-01T18:25:48.287360981+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BailResponse {
    @JsonProperty("ResponseInfo")

    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("bail")
    @Valid
    private Bail bail = null;

}
