package com.dristi.njdg_transformer.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Act {

    @JsonProperty("id")
    private Integer id;

    @JsonProperty("cino")
    private String cino;

    @JsonProperty("act_code")
    private Integer actCode;

    @JsonProperty("act_name")
    private String actName;

    @JsonProperty("act_section")
    private String actSection;

    @JsonProperty("sr_no")
    private Integer srNo;
}
