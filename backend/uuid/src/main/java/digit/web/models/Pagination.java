package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Pagination {

    @JsonProperty("limit")
    private Integer limit;

    @JsonProperty("offSet")
    private Integer offSet;

    @JsonProperty("totalCount")
    private Long totalCount;

    @JsonProperty("sortBy")
    private String sortBy;

    @JsonProperty("order")
    private String order;
}
