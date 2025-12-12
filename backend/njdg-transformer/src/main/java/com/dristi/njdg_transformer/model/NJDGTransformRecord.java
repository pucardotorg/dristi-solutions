package com.dristi.njdg_transformer.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NJDGTransformRecord {

    @JsonProperty("cino")
    private String cino = "";

    @JsonProperty("date_of_filing")
    private LocalDate dateOfFiling = null;

    @JsonProperty("dt_regis")
    private LocalDate dtRegis = null;

    @JsonProperty("case_type")
    private Integer caseType;

    @JsonProperty("fil_no")
    private Integer filNo;

    @JsonProperty("fil_year")
    private Integer filYear;

    @JsonProperty("reg_no")
    private Integer regNo;

    @JsonProperty("reg_year")
    private Integer regYear;

    @JsonProperty("date_first_list")
    private LocalDate dateFirstList = null;

    @JsonProperty("date_next_list")
    private LocalDate dateNextList = null;

    @JsonProperty("pend_disp")
    private Character pendDisp;

    @JsonProperty("date_of_decision")
    private LocalDate dateOfDecision = null;

    @JsonProperty("disp_reason")
    private Integer dispReason;

    @JsonProperty("disp_nature")
    private Integer dispNature;

    @JsonProperty("desgname")
    private String desgname = "";

    @JsonProperty("court_no")
    private Integer courtNo;

    @JsonProperty("est_code")
    private String estCode = "";

    @JsonProperty("state_code")
    private Integer stateCode;

    @JsonProperty("dist_code")
    private Integer distCode;

    @JsonProperty("purpose_code")
    private Integer purposeCode;

    @JsonProperty("purpose_next")
    private Integer purposeNext;

    @JsonProperty("purpose_previous")
    private Integer purposePrevious;

    @JsonProperty("pet_name")
    private String petName = "";

    @JsonProperty("pet_adv")
    private String petAdv = "";

    @JsonProperty("pet_adv_cd")
    private Integer petAdvCd;

    @JsonProperty("res_name")
    private String resName = "";

    @JsonProperty("res_adv")
    private String resAdv = "";

    @JsonProperty("res_adv_cd")
    private Integer resAdvCd;

    @JsonProperty("pet_adv_bar_reg")
    private String petAdvBarReg = "";

    @JsonProperty("res_adv_bar_reg")
    private String resAdvBarReg = "";

    @JsonProperty("police_st_code")
    private Integer policeStCode;

    @JsonProperty("police_ncode")
    private String policeNcode = "";

    @JsonProperty("fir_no")
    private Integer firNo;

    @JsonProperty("police_station")
    private String policeStation = "";

    @JsonProperty("fir_year")
    private Integer firYear;

    @JsonProperty("date_last_list")
    private LocalDate dateLastList = null;

    @JsonProperty("main_matter_cino")
    private String mainMatterCino = "";

    @JsonProperty("pet_age")
    private Integer petAge;

    @JsonProperty("res_age")
    private Integer resAge;

    @JsonProperty("pet_address")
    private String petAddress = "";

    @JsonProperty("res_address")
    private String resAddress = "";

    @JsonProperty("jocode")
    private String jocode = "";

    @JsonProperty("cicri_type")
    private Character cicriType = ' ';

    @JsonProperty("judge_code")
    private Integer judgeCode;

    @JsonProperty("desig_code")
    private Integer desigCode;

    @JsonProperty("pet_extra_party")
    private List<PartyDetails> petExtraParty;

    @JsonProperty("res_extra_party")
    private List<PartyDetails> resExtraParty;

    @JsonProperty("act")
    private List<Act> acts;

    @JsonProperty("historyofcasehearing")
    private List<HearingDetails> historyOfCaseHearing;

    @JsonProperty("interimorder")
    private List<InterimOrder> interimOrders;
}
