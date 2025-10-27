package com.dristi.njdg_transformer.repository.querybuilder;

import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Component;

import java.sql.Types;
import java.util.List;

@Component
@Slf4j
public class CaseQueryBuilder {

    private final String INSERT_QUERY = "";

    private final String UPDATE_QUERY = "";

    private final String BASE_CASE_QUERY = "SELECT \n" +
            "    cino AS cino,\n" +
            "    date_of_filing AS date_of_filing,\n" +
            "    dt_regis AS dt_regis,\n" +
            "    case_type AS case_type,\n" +
            "    fil_no AS fil_no,\n" +
            "    fil_year AS fil_year,\n" +
            "    reg_no AS reg_no,\n" +
            "    reg_year AS reg_year,\n" +
            "    date_first_list AS date_first_list,\n" +
            "    date_next_list AS date_next_list,\n" +
            "    pend_disp AS pend_disp,\n" +
            "    date_of_decision AS date_of_decision,\n" +
            "    disp_reason AS disp_reason,\n" +
            "    disp_nature AS disp_nature,\n" +
            "    desgname AS desgname,\n" +
            "    court_no AS court_no,\n" +
            "    est_code AS est_code,\n" +
            "    state_code AS state_code,\n" +
            "    dist_code AS dist_code,\n" +
            "    purpose_code AS purpose_code,\n" +
            "    pet_name AS pet_name,\n" +
            "    pet_adv AS pet_adv,\n" +
            "    pet_adv_cd AS pet_adv_cd,\n" +
            "    res_name AS res_name,\n" +
            "    res_adv AS res_adv,\n" +
            "    res_adv_cd AS res_adv_cd,\n" +
            "    pet_adv_bar_reg AS pet_adv_bar_reg,\n" +
            "    res_adv_bar_reg AS res_adv_bar_reg,\n" +
            "    police_st_code AS police_st_code,\n" +
            "    police_ncode AS police_ncode,\n" +
            "    fir_no AS fir_no,\n" +
            "    police_station AS police_station,\n" +
            "    fir_year AS fir_year,\n" +
            "    date_last_list AS date_last_list,\n" +
            "    main_matter_cino AS main_matter_cino,\n" +
            "    pet_age AS pet_age,\n" +
            "    res_age AS res_age,\n" +
            "    pet_address AS pet_address,\n" +
            "    res_address AS res_address,\n" +
            "    jocode AS jocode,\n" +
            "    cicri_type AS cicri_type\n";

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
            mainQuery = addWhereClause(mainQuery);
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
        return "SELECT type_code FROM disp_type WHERE court_disp_code = ?";
    }

    public String getDistrictQuery() {
        return "SELECT district_code FROM district_t WHERE name ILIKE ?";
    }

    public String getPoliceStationQuery() {
        return "SELECT police_st_code as policeStationCode, st_name as stName, nat_code as natCode, police_code as policeCode FROM police_t WHERE police_code = ?";
    }

    public String getJudgeMasterQuery(){
        return "SELECT judge_code as judge_code, judge_name as judge_name, jocode as jocode, judge_username as judge_username FROM judge_t WHERE judge_username = ?";
    }

    public String getPartyQuery() {
        return "SELECT party_name as party_name, party_no as party_no, party_address as party_address, party_age as party_age, party_id as party_id FROM extra_parties WHERE cino = ? AND party_type = ?";
    }

    public String getUpdatePartyQuery() {
        return "INSERT INTO extra_parties (id, cino, party_type, party_no, party_name, party_address, party_age, party_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?)";
    }

    public String getUpdateQuery() {
        return """
                UPDATE cases SET
                    date_of_filing = ?,
                    dt_regis = ?,
                    case_type = ?,
                    fil_no = ?,
                    fil_year = ?,
                    reg_no = ?,
                    reg_year = ?,
                    date_first_list = ?,
                    date_next_list = ?,
                    pend_disp = ?,
                    date_of_decision = ?,
                    disp_reason = ?,
                    disp_nature = ?,
                    desgname = ?,
                    court_no = ?,
                    est_code = ?,
                    state_code = ?,
                    dist_code = ?,
                    purpose_code = ?,
                    pet_name = ?,
                    pet_adv = ?,
                    pet_adv_cd = ?,
                    res_name = ?,
                    res_adv = ?,
                    res_adv_cd = ?,
                    pet_adv_bar_reg = ?,
                    res_adv_bar_reg = ?,
                    police_st_code = ?,
                    police_ncode = ?,
                    fir_no = ?,
                    police_station = ?,
                    fir_year = ?,
                    date_last_list = ?,
                    main_matter_cino = ?,
                    pet_age = ?,
                    res_age = ?,
                    pet_address = ?,
                    res_address = ?,
                    jocode = ?,
                    cicri_type = ?
                WHERE cino = ?
                """;
    }

    public String getInsertQuery() {
        return """
                INSERT INTO cases (
                    cino,
                    date_of_filing,
                    dt_regis,
                    case_type,
                    fil_no,
                    fil_year,
                    reg_no,
                    reg_year,
                    date_first_list,
                    date_next_list,
                    pend_disp,
                    date_of_decision,
                    disp_reason,
                    disp_nature,
                    desgname,
                    court_no,
                    est_code,
                    state_code,
                    dist_code,
                    purpose_code,
                    pet_name,
                    pet_adv,
                    pet_adv_cd,
                    res_name,
                    res_adv,
                    res_adv_cd,
                    pet_adv_bar_reg,
                    res_adv_bar_reg,
                    police_st_code,
                    police_ncode,
                    fir_no,
                    police_station,
                    fir_year,
                    date_last_list,
                    main_matter_cino,
                    pet_age,
                    res_age,
                    pet_address,
                    res_address,
                    jocode,
                    cicri_type
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """;
    }

    public String getActQuery() {
        return "SELECT * FROM acts WHERE cino = ? ";
    }

    public String getActMasterQuery() {
        return "SELECT * FROM act_t WHERE act_name ILIKE (?)";
    }

    public String getInsertActQuery() {
        return """
                INSERT INTO acts (
                    id,
                    cino,
                    act_code,
                    act_name,
                    act_section
                ) VALUES (?,?,?,?,?)
                """;
    }

    public String getJudgeDesignationQuery() {
        return "SELECT desg_name FROM desg_type WHERE court_desg_code = ?";
    }

    public String getDesignationMasterQuery() {
        return "SELECT * FROM desg_type WHERE court_desg_code = ?";
    }
}