package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.Data;

import java.util.List;


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

    @JsonProperty("path")
    @Valid
    private List<String> path = null;

    @JsonProperty("id")
    @Valid
    private Integer id = null;
}

