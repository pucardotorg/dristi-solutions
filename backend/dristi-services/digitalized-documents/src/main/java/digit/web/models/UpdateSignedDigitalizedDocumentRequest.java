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
public class UpdateSignedDigitalizedDocumentRequest {
    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo;

    @JsonProperty("signedDocuments")
    private List<SignedDigitalizedDocument> signedDocuments;

    public UpdateSignedDigitalizedDocumentRequest addSignedDocumentItem(SignedDigitalizedDocument signedDocument) {
        if(this.signedDocuments == null){
            signedDocuments = new ArrayList<>();
        }
        this.signedDocuments.add(signedDocument);
        return this;
    }

}
