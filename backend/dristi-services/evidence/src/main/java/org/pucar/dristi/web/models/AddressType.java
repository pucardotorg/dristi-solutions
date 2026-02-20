package org.pucar.dristi.web.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddressType {
    private int id;
    private String name;
    private String code;
    private boolean isActive;
}

