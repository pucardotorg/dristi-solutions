package pucar.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderExists {

    @JsonProperty("orderId")
    private UUID orderId = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("applicationNumber")
    private String applicationNumber = null;

    @JsonProperty("orderNumber")
    private String orderNumber = null;

    @JsonProperty("exists")
    private Boolean exists = null;
}
