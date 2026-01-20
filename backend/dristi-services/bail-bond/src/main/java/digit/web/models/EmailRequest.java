package digit.web.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;

@Validated
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
