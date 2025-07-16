package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateSignedBailRequest {
    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("signedBails")
    @Valid
    private List<SignedBail> signedBails = null;

    public UpdateSignedBailRequest addSignedBailsItem(SignedBail signedBailsItem) {
        if (this.signedBails == null) {
            this.signedBails = new ArrayList<>();
        }
        this.signedBails.add(signedBailsItem);
        return this;
    }
}
