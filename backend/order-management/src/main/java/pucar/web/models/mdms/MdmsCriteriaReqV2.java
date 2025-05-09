package pucar.web.models.mdms;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.Builder;
import org.egov.common.contract.request.RequestInfo;

@Builder
public class MdmsCriteriaReqV2 {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("MdmsCriteria")
    @Valid
    private MdmsCriteriaV2 mdmsCriteria = null;
}
