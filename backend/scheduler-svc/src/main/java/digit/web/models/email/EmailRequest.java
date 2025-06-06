package digit.web.models.email;

import lombok.*;
import org.egov.common.contract.request.RequestInfo;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Setter
@Getter
@EqualsAndHashCode
public class EmailRequest {
    private RequestInfo requestInfo;

    private Email email;
}
