package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

/**
 * LeaveOfficeRequest
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2026-01-20T20:30:21.456282080+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LeaveOfficeRequest {
    @JsonProperty("RequestInfo")
    @NotNull

    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("leaveOffice")
    @NotNull

    @Valid
    private LeaveOffice leaveOffice = null;


}
