package com.dristi.njdg_transformer.model.cases;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseRequest {
    private RequestInfo requestInfo;
    private CourtCase courtCase;
}
