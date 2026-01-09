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

/**
 * DigitalizedDocumentSearchResponse
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-11-25T18:36:45.881826585+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DigitalizedDocumentSearchResponse {

    @JsonProperty("ResponseInfo")
    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("documents")
    @Valid
    private List<DigitalizedDocument> documents = null;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination = null;

    @JsonProperty("totalCount")
    private Integer totalCount = null;


    public DigitalizedDocumentSearchResponse addDocumentsItem(DigitalizedDocument documentsItem) {
        if (this.documents == null) {
            this.documents = new ArrayList<>();
        }
        this.documents.add(documentsItem);
        return this;
    }

}
