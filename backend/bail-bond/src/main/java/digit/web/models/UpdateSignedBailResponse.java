package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateSignedBailResponse {
    @JsonProperty("ResponseInfo")
    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("bails")
    @Valid
    private List<Bail> bails = null;

    public UpdateSignedBailResponse addBailListItem(Bail bailListItem) {
        if (this.bails == null) {
            this.bails = new ArrayList<>();
        }
        this.bails.add(bailListItem);
        return this;
    }
}
