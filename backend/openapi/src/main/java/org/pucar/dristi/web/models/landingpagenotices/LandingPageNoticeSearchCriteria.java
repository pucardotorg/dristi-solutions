package org.pucar.dristi.web.models.landingpagenotices;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LandingPageNoticeSearchCriteria {
    private String searchText;
    private Integer limit;
    private Integer offset;
}
