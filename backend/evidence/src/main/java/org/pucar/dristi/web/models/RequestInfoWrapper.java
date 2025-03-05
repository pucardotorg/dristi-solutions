<<<<<<<< HEAD:backend/evidence/src/main/java/org/pucar/dristi/web/models/RequestInfoWrapper.java
package org.pucar.dristi.web.models;
========
package org.egov.wf.web.models;
>>>>>>>> f408fe5bc87043cc596699e8314cb8f4f4ffab78:common/egov-workflow-v2/src/main/java/org/egov/wf/web/models/RequestInfoWrapper.java

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RequestInfoWrapper {

	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;
}
