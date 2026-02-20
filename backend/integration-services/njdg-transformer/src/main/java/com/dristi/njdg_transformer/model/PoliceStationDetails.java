package com.dristi.njdg_transformer.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PoliceStationDetails {

    private Integer policeStationCode;
    private String stName;
    private String natCode;
    private String policeCode;
}
