package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import java.util.List;
import java.util.ArrayList;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BailListResponse {
    @JsonProperty("responseInfo")
    @Valid
    private ResponseInfo responseInfo;
    @JsonProperty("totalCount")
    private Integer totalCount;
    @JsonProperty("bailList")
    @Valid
    private List<Bail> bailList;

    public BailListResponse addBailListItem(Bail bailItem) {
        if (this.bailList == null) {
            this.bailList = new ArrayList<>();
        }
        this.bailList.add(bailItem);
        return this;
    }
}
