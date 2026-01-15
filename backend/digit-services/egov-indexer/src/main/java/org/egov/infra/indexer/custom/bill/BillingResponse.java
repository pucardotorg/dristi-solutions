package org.egov.infra.indexer.custom.bill;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingResponse {

    @JsonProperty("ResposneInfo")
    private ResponseInfo resposneInfo = null;

    @JsonProperty("Bill")
    private List<Bill> bill = new ArrayList<>();

}