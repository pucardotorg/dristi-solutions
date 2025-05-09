package pucar.web.models.calculator;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import org.egov.common.contract.request.RequestInfo;

import java.util.List;

public class TaskPaymentRequest {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("Criteria")
    @Valid
    private List<TaskPaymentCriteria> calculationCriteria = null;
}
