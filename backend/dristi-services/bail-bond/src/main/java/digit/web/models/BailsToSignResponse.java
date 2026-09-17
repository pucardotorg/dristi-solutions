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
public class BailsToSignResponse {
    @JsonProperty("ResponseInfo")
    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("bailList")
    @Valid
    private List<BailToSign> bailList = null;

    public BailsToSignResponse addBailListItem(BailToSign bailListItem) {
        if (this.bailList == null) {
            this.bailList = new ArrayList<>();
        }
        this.bailList.add(bailListItem);
        return this;
    }
}
