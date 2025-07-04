package digit.web.models;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * BailSearchRequest
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-07-01T18:25:48.287360981+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BailSearchRequest {
    @JsonProperty("RequestInfo")

    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("criteria")
    @Valid
    private List<BailCriteria> criteria = new ArrayList<>();

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination;

    @JsonProperty("flow")
    private String flow;

    public BailSearchRequest addCriteriaItem(BailCriteria criteriaItem) {
        this.criteria.add(criteriaItem);
        return this;
    }
}
