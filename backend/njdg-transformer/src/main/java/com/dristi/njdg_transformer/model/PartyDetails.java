package com.dristi.njdg_transformer.model;

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
    private String partyType;

    @JsonProperty("party_no")
    private Integer partyNo;

    @JsonProperty("party_name")
    private String partyName;

    @JsonProperty("party_address")
    private String partyAddress;

    @JsonProperty("party_age")
    private Integer partyAge;
}
