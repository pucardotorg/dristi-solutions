package org.pucar.dristi.web.models.bailbond;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.web.models.Pagination;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * BailSearchResponse
 */
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BailSearchResponse {
    @JsonProperty("ResponseInfo")
    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("bails")
    @Valid
    private List<Bail> bails = null;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination = null;


    public BailSearchResponse addBailsItem(Bail bailsItem) {
        if (this.bails == null) {
            this.bails = new ArrayList<>();
        }
        this.bails.add(bailsItem);
        return this;
    }

}
