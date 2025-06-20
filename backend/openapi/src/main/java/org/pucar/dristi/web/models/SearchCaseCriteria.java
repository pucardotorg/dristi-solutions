package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.Valid;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SearchCaseCriteria {


    @JsonProperty("searchType")                 // Enum: FILING_NUMBER, CASE_NUMBER, CNR_NUMBER, ADVOCATE, LITIGANT, ALL
    @Valid
    private SearchType searchType;

    @JsonProperty("filingNumberCriteria")       // for FILING_NUMBER
    @Valid
    private FilingNumberCriteria filingNumberCriteria;

    @JsonProperty("caseNumberCriteria")         // for CASE_NUMBER
    @Valid
    private CaseNumberCriteria caseNumberCriteria;

    @JsonProperty("cnrNumberCriteria")          // for CNR_NUMBER
    @Valid
    private CnrNumberCriteria cnrNumberCriteria;

    @JsonProperty("advocateCriteria")          // for ADVOCATE
    @Valid
    private AdvocateCriteria advocateCriteria;

    @JsonProperty("litigantCriteria")         // for LITIGANT
    @Valid
    private LitigantCriteria litigantCriteria;

}
