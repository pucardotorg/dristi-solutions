package org.pucar.dristi.web.models.inbox;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.pucar.dristi.web.models.Order;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderBy {

    @JsonProperty("code")
    private String code;

    @JsonProperty("order")
    private Order order;
}
