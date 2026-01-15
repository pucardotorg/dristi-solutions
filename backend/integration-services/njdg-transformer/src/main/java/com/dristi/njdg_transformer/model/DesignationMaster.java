package com.dristi.njdg_transformer.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DesignationMaster {

    private Integer desgCode;
    private String desgName;
    private String natCode;
    private String courtDesgCode;
}
