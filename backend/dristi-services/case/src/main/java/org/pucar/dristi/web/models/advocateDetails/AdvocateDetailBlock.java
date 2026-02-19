package org.pucar.dristi.web.models.advocateDetails;

import lombok.*;
import org.pucar.dristi.web.models.Advocate;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvocateDetailBlock {

    private Complainant complainant;

    private PipStatus isComplainantPip;

    private UiFlags uiFlags;

    private Documents documents;

    private List<Advocate> advocates;

    private Integer displayIndex;

    private Boolean isEnabled;

    private Boolean isFormCompleted;
}
