package com.dristi.njdg_transformer.repository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class NJDGQueryBuilder {

    private final String INSERT_QUERY = """
        INSERT INTO njdg_transform_record (
            cino, date_of_filing, dt_regis, case_type, fil_no, fil_year, reg_no, reg_year,
            date_first_list, date_next_list, pend_disp, date_of_decision, disp_reason, disp_nature,
            desgname, court_no, est_code, state_code, dist_code, purpose_code,
            pet_name, pet_adv, pet_adv_cd, res_name, res_adv, res_adv_cd,
            pet_adv_bar_reg, res_adv_bar_reg, police_st_code, police_ncode, fir_no, police_station,
            fir_year, date_last_list, main_matter_cino,
            pet_extra_party, res_extra_party, pet_age, res_age, pet_address, res_address,
            jocode, cicri_type, act, historyofcasehearing, interimorder, iafiling
        ) VALUES (
            :cino, :dateOfFiling, :dtRegis, :caseType, :filNo, :filYear, :regNo, :regYear,
            :dateFirstList, :dateNextList, :pendDisp, :dateOfDecision, :dispReason, :dispNature,
            :desgname, :courtNo, :estCode, :stateCode, :distCode, :purposeCode,
            :petName, :petAdv, :petAdvCd, :resName, :resAdv, :resAdvCd,
            :petAdvBarReg, :resAdvBarReg, :policeStCode, :policeNcode, :firNo, :policeStation,
            :firYear, :dateLastList, :mainMatterCino,
            :petExtraParty, :resExtraParty, :petAge, :resAge, :petAddress, :resAddress,
            :jocode, :cicriType, :act, :historyOfCaseHearing, :interimOrder, :iaFiling
        )
        """;

    private final String UPDATE_QUERY = """
        UPDATE njdg_transform_record
        SET
            date_of_filing = :dateOfFiling,
            dt_regis = :dtRegis,
            case_type = :caseType,
            fil_no = :filNo,
            fil_year = :filYear,
            reg_no = :regNo,
            reg_year = :regYear,
            date_first_list = :dateFirstList,
            date_next_list = :dateNextList,
            pend_disp = :pendDisp,
            date_of_decision = :dateOfDecision,
            disp_reason = :dispReason,
            disp_nature = :dispNature,
            desgname = :desgname,
            court_no = :courtNo,
            est_code = :estCode,
            state_code = :stateCode,
            dist_code = :distCode,
            purpose_code = :purposeCode,
            pet_name = :petName,
            pet_adv = :petAdv,
            pet_adv_cd = :petAdvCd,
            res_name = :resName,
            res_adv = :resAdv,
            res_adv_cd = :resAdvCd,
            pet_adv_bar_reg = :petAdvBarReg,
            res_adv_bar_reg = :resAdvBarReg,
            police_st_code = :policeStCode,
            police_ncode = :policeNcode,
            fir_no = :firNo,
            police_station = :policeStation,
            fir_year = :firYear,
            date_last_list = :dateLastList,
            main_matter_cino = :mainMatterCino,
            pet_extra_party = :petExtraParty,
            res_extra_party = :resExtraParty,
            pet_age = :petAge,
            res_age = :resAge,
            pet_address = :petAddress,
            res_address = :resAddress,
            jocode = :jocode,
            cicri_type = :cicriType,
            act = :act,
            historyofcasehearing = :historyOfCaseHearing,
            interimorder = :interimOrder,
            iafiling = :iaFiling
        WHERE cino = :cino;
        """;

    public String insertQuery() {
        return INSERT_QUERY;
    }

    public String updateQuery() {
        return UPDATE_QUERY;
    }
}