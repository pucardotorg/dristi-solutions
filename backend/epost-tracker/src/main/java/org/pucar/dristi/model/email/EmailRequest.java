package org.pucar.dristi.model.email;

import lombok.*;
import org.egov.common.contract.request.RequestInfo;

@AllArgsConstructor
@Getter
@Builder
@EqualsAndHashCode
@NoArgsConstructor
public class EmailRequest {
    private RequestInfo requestInfo;
    private Email email;
}
