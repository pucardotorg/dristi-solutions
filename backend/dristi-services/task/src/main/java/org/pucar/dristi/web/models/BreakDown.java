package org.pucar.dristi.web.models;

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
    private String code;
    private Double amount;
    private Object additionalParams;
}
