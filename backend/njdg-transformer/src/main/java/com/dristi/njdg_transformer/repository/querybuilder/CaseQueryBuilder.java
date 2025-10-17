package com.dristi.njdg_transformer.repository.querybuilder;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;

@Component
@Slf4j
public class CaseQueryBuilder {

    private final String INSERT_QUERY = "";

    private final String UPDATE_QUERY = "";

    private final String BASE_CASE_QUERY = "SELECT \n" +
            "    cino AS \"cino\",\n" +
            "    date_of_filing AS \"dateOfFiling\",\n" +
            "    dt_regis AS \"dtRegis\",\n" +
            "    case_type AS \"caseType\",\n" +
            "    fil_no AS \"filNo\",\n" +
            "    fil_year AS \"filYear\",\n" +
            "    reg_no AS \"regNo\",\n" +
            "    reg_year AS \"regYear\",\n" +
            "    date_first_list AS \"dateFirstList\",\n" +
            "    date_next_list AS \"dateNextList\",\n" +
            "    pend_disp AS \"pendDisp\",\n" +
            "    date_of_decision AS \"dateOfDecision\",\n" +
            "    disp_reason AS \"dispReason\",\n" +
            "    disp_nature AS \"dispNature\",\n" +
            "    desgname AS \"desgname\",\n" +
            "    court_no AS \"courtNo\",\n" +
            "    est_code AS \"estCode\",\n" +
            "    state_code AS \"stateCode\",\n" +
            "    dist_code AS \"distCode\",\n" +
            "    purpose_code AS \"purposeCode\",\n" +
            "    pet_name AS \"petName\",\n" +
            "    pet_adv AS \"petAdv\",\n" +
            "    pet_adv_cd AS \"petAdvCd\",\n" +
            "    res_name AS \"resName\",\n" +
            "    res_adv AS \"resAdv\",\n" +
            "    res_adv_cd AS \"resAdvCd\",\n" +
            "    pet_adv_bar_reg AS \"petAdvBarReg\",\n" +
            "    res_adv_bar_reg AS \"resAdvBarReg\",\n" +
            "    police_st_code AS \"policeStCode\",\n" +
            "    police_ncode AS \"policeNcode\",\n" +
            "    fir_no AS \"firNo\",\n" +
            "    police_station AS \"policeStation\",\n" +
            "    fir_year AS \"firYear\",\n" +
            "    date_last_list AS \"dateLastList\",\n" +
            "    main_matter_cino AS \"mainMatterCino\",\n" +
            "    pet_age AS \"petAge\",\n" +
            "    res_age AS \"resAge\",\n" +
            "    pet_address AS \"petAddress\",\n" +
            "    res_address AS \"resAddress\",\n" +
            "    jocode AS \"jocode\",\n" +
            "    cicri_type AS \"cicriType\"\n";

    private final String FROM_QUERY = " FROM cases";
    public String insertQuery() {
        return INSERT_QUERY;
    }

    public String updateQuery() {
        return UPDATE_QUERY;
    }
    public String getCaseQuery(String cnrNumber, List<Object> preparedStList, List<Integer> preparedStArgsList) {
        String mainQuery = BASE_CASE_QUERY + FROM_QUERY;
        if(cnrNumber != null && !cnrNumber.isEmpty()){
            mainQuery = addWhereClause(BASE_CASE_QUERY);
            preparedStList.add(cnrNumber);
            preparedStArgsList.add(Types.VARCHAR);
        }
        return mainQuery;
    }

    private String addWhereClause(String baseCaseQuery) {
        return baseCaseQuery += " WHERE cino = ?";
    }

    public String getCaseTypeQuery() {
        return "SELECT case_type_code FROM case_type WHERE case_type_court = ?";
    }
    public String getDisposalTypeQuery() {
        return "SELECT type_code FROM disp_type WHERE type_name = ?";
    }

    public String getDistrictQuery() {
        return "SELECT district_code FROM district_t WHERE name = ?";
    }
}