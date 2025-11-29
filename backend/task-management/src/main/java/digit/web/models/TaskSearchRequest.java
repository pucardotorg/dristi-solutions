package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * TaskSearchRequest
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-10-27T11:32:01.103620686+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskSearchRequest {
    @JsonProperty("RequestInfo")
    @NotNull
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("criteria")
    @Valid
    @NotNull
    private TaskSearchCriteria criteria = null;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination = null;


}
