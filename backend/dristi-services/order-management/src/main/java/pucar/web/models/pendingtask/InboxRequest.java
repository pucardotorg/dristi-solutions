package pucar.web.models.pendingtask;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;

import javax.validation.Valid;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class InboxRequest   {
    @JsonProperty("RequestInfo")
    private RequestInfo RequestInfo;

    @Valid
    @JsonProperty("inbox")
    private InboxSearchCriteria inbox ;



}