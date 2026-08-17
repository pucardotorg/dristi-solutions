package org.pucar.dristi.web.models;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CauseListResult {
    private List<Map<String, Object>> hearings;
    private int totalCount;
}
