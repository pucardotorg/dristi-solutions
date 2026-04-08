package com.dristi.njdg_transformer.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrimaryPartyDetails {

    private String partyName;

    private String partyAddress;

    private String partyAge;
}
