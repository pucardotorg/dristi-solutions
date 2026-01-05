package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DigitalizedDocumentsToSignRequest {
    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("criteria")
    @Valid
    private List<DigitalizedDocumentsCriteria> criteria = null;

    public DigitalizedDocumentsToSignRequest addCriteriaItem(DigitalizedDocumentsCriteria criteriaItem) {
        if (this.criteria == null) {
            this.criteria = new ArrayList<>();
        }
        this.criteria.add(criteriaItem);
        return this;
    }
}
