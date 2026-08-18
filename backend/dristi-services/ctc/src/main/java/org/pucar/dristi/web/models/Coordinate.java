package org.pucar.dristi.web.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Coordinate {

    private float x;
    private float y;
    private boolean found;
    private int pageNumber;
    private String fileStoreId;
    private String tenantId;
}
