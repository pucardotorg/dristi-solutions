package org.egov.user.web.contract;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.egov.common.contract.request.RequestInfo;

/*
	Request to stop showing the set-password prompt to the logged-in user. The user is resolved
	from the RequestInfo, so there is deliberately nothing else in the body to spoof.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SuppressPasswordPromptRequest {

    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;
}
