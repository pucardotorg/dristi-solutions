package com.dristi.njdg_transformer.model.inbox;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Inbox {

    @JsonProperty("ProcessInstance")
    private ProcessInstance ProcessInstance;

    @JsonProperty("businessObject")
    private Map<String,Object> businessObject;

    @JsonProperty("serviceObject")
    private Map<String,Object>	serviceObject;
}
