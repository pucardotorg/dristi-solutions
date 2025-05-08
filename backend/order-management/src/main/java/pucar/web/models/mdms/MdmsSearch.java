package pucar.web.models.mdms;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import org.egov.common.contract.request.RequestInfo;

@Builder
public class MdmsSearch {

    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;

    @JsonProperty("SchemaDefCriteria")
    private SchemaDefCriteria schemaDefCriteria;
}
