package digit.web.models.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import digit.web.models.Pagination;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;

/**
 * CaseSearchRequest
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-15T11:31:40.281899+05:30[Asia/Kolkata]")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderSearchRequest {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("criteria")
    @Valid
    private OrderCriteria criteria = null;

    @JsonProperty("pagination")
    private Pagination pagination = null;

}