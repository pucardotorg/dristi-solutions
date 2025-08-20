package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.Data;


@Data
public class ItemTextMdms {

    @JsonProperty("orderType")
    @Valid
    private String orderType = null;

    @JsonProperty("action")
    @Valid
    private String action = null;

    @JsonProperty("itemText")
    @Valid
    private String itemText = null;
}

