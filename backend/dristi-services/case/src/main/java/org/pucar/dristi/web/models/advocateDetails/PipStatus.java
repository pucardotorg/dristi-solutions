package org.pucar.dristi.web.models.advocateDetails;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PipStatus {

    private String code;

    private String label;

    private Boolean isEnabled;
}

