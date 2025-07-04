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
public class BailListResponse {
    @JsonProperty("responseInfo")

    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("TotalCount")

    private Integer totalCount = null;

    @JsonProperty("bailList")
    @Valid
    private List<Bail> bailList = null;


    public BailListResponse addHearingListItem(Bail bailItem) {
        if (this.bailList == null) {
            this.bailList = new ArrayList<>();
        }
        this.bailList.add(bailItem);
        return this;
    }
}
