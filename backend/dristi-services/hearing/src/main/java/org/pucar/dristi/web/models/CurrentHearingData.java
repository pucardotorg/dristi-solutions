package org.pucar.dristi.web.models;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentHearingData {
    private String sessionStatus;
    private String currentHearingKey;
    private Map<String, Object> hearingData;
}
