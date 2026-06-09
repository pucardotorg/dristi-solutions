package org.egov.eTreasury.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FeeBreakDown {
    private String feeName;
    private double feeAmount;
}

