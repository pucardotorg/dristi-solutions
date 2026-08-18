package com.dristi.njdg_transformer.model;

import com.dristi.njdg_transformer.model.enums.PartyType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartyDetails {

    @JsonProperty("id")
    private Integer id;

    @JsonProperty("cino")
    private String cino;

    @JsonProperty("party_type")
    private PartyType partyType;

    @JsonProperty("party_no")
    private Integer partyNo;

    @JsonProperty("party_name")
    private String partyName;

    @JsonProperty("party_address")
    private String partyAddress;

    @JsonProperty("party_age")
    private Integer partyAge;

    @JsonProperty("party_id")
    private String partyId;

    @JsonProperty("adv_name")
    private String advName;

    @JsonProperty("adv_cd")
    private Integer advCd;

    @JsonProperty("sr_no")
    private Integer srNo;
}
