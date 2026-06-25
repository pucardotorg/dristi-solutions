package com.dristi.njdg_transformer.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExtraAdvocateDetails {

    @JsonProperty("id")
    private Integer id;

    @JsonProperty("party_no")
    private Integer partyNo;

    @JsonProperty("cino")
    private String cino;

    @JsonProperty("pet_res_name")
    private String petResName;

    @JsonProperty("type")
    private Integer type;

    @JsonProperty("adv_name")
    private String advName;

    @JsonProperty("adv_code")
    private Integer advCode;

    @JsonProperty("sr_no")
    private Integer srNo;
}
