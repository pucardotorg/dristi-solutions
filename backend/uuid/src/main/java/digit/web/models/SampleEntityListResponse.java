package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SampleEntityListResponse {

    @JsonProperty("ResponseInfo")
    private ResponseInfo responseInfo;

    @JsonProperty("list")
    private List<SampleEntity> list;

    @JsonProperty("totalCount")
    private Integer totalCount;

    @JsonProperty("pagination")
    private Pagination pagination;
}
