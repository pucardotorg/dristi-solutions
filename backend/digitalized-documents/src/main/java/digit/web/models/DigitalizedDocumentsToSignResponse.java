package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DigitalizedDocumentsToSignResponse {
    @JsonProperty("ResponseInfo")
    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("documentList")
    @Valid
    private List<DigitalizedDocumentToSign> documentList = null;

    public DigitalizedDocumentsToSignResponse addDocumentListItem(DigitalizedDocumentToSign documentListItem) {
        if (this.documentList == null) {
            this.documentList = new ArrayList<>();
        }
        this.documentList.add(documentListItem);
        return this;
    }
}
