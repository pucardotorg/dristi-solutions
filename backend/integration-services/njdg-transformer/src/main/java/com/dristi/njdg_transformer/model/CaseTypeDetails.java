package com.dristi.njdg_transformer.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseTypeDetails {

    // Registration Details (Old)
    @JsonProperty("oldregcase_type")
    private Integer oldRegCaseType;

    @JsonProperty("oldreg_no")
    private Integer oldRegNo;

    @JsonProperty("oldreg_year")
    private Integer oldRegYear;

    // Registration Details (New)
    @JsonProperty("newregcase_type")
    private Integer newRegCaseType;

    @JsonProperty("newreg_no")
    private Integer newRegNo;

    @JsonProperty("newreg_year")
    private Integer newRegYear;

    // Filing Details (Old)
    @JsonProperty("oldfilcase_type")
    private Integer oldFilCaseType;

    @JsonProperty("oldfil_no")
    private Integer oldFilNo;

    @JsonProperty("oldfil_year")
    private Integer oldFilYear;

    // Filing Details (New)
    @JsonProperty("newfilcase_type")
    private Integer newFilCaseType;

    @JsonProperty("newfil_no")
    private Integer newFilNo;

    @JsonProperty("newfil_year")
    private Integer newFilYear;

    @JsonProperty("sr_no")
    private Integer srNo;

    @JsonProperty("cino")
    private String cino;

    @JsonProperty("jocode")
    private String jocode;
}
