package pucar.web.models.digitalizeddocument;

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
    private Double limit = null;

    @JsonProperty("offset")
    private Double offset = null;

    @JsonProperty("totalCount")
    private Double totalCount = null;

    @JsonProperty("sortBy")
    private String sortBy = null;

    @JsonProperty("order")
    private String order = null;
}
