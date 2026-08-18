package org.pucar.dristi.web.models.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.web.models.Pagination;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

/**
 * OrderListResponse
 */
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderListResponse {

    @JsonProperty("ResponseInfo")
    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("TotalCount")
    private Integer totalCount = null;

    @JsonProperty("list")
    @Valid
    private List<Order> list = null;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination = null;

}
