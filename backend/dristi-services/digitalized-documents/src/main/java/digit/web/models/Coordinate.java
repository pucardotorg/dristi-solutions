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
public class Coordinate {
    @JsonProperty("fileStoreId")
    private String fileStoreId;

    @JsonProperty("x")
    private Double x;

    @JsonProperty("y")
    private Double y;

    @JsonProperty("pageNumber")
    private Integer pageNumber;

    @JsonProperty("tenantId")
    private String tenantId;
}
