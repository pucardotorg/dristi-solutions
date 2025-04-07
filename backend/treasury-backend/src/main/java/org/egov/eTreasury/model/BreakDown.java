package org.egov.eTreasury.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BreakDown {

    private String type;
    private Double amount;
    private Object additionalParams;
}
