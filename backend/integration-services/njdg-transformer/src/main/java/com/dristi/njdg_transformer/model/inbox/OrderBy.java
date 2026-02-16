package com.dristi.njdg_transformer.model.inbox;

import com.dristi.njdg_transformer.model.enums.Order;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
