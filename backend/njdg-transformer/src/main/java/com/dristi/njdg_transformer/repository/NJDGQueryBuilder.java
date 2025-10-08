package com.dristi.njdg_transformer.repository;


import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class NJDGQueryBuilder {

    private final String INSERT_QUERY = "INSERT INTO njdg_transform_record (\n" +
            "    cino, date_of_filing, dt_regis, case_type, fil_no, fil_year, reg_no, reg_year,\n" +
            "    date_first_list, date_next_list, pend_disp, date_of_decision, disp_reason, disp_nature,\n" +
            "    desgname, court_no, est_code, state_code, dist_code, purpose_code,\n" +
            "    pet_name, pet_adv, pet_adv_cd, res_name, res_adv, res_adv_cd,\n" +
            "    pet_adv_bar_reg, res_adv_bar_reg, police_st_code, police_ncode, fir_no, police_station,\n" +
            "    fir_year, date_last_list, main_matter_cino,\n" +
            "    pet_extra_party, res_extra_party, pet_age, res_age, pet_address, res_address,\n" +
            "    jocode, cicri_type, act, historyofcasehearing, interimorder, iafiling\n" +
            ") VALUES (\n" +
            "    :cino, :date_of_filing, :dt_regis, :case_type, :fil_no, :fil_year, :reg_no, :reg_year,\n" +
            "    :date_first_list, :date_next_list, :pend_disp, :date_of_decision, :disp_reason, :disp_nature,\n" +
            "    :desgname, :court_no, :est_code, :state_code, :dist_code, :purpose_code,\n" +
            "    :pet_name, :pet_adv, :pet_adv_cd, :res_name, :res_adv, :res_adv_cd,\n" +
            "    :pet_adv_bar_reg, :res_adv_bar_reg, :police_st_code, :police_ncode, :fir_no, :police_station,\n" +
            "    :fir_year, :date_last_list, :main_matter_cino,\n" +
            "    :pet_extra_party, :res_extra_party, :pet_age, :res_age, :pet_address, :res_address,\n" +
            "    :jocode, :cicri_type, :act, :historyofcasehearing, :interimorder, :iafiling\n" +
            ");\n";

    private final String UPDATE_QUERY = "UPDATE njdg_transform_record\n" +
            "SET\n" +
            "    date_of_filing = :date_of_filing,\n" +
            "    dt_regis = :dt_regis,\n" +
            "    case_type = :case_type,\n" +
            "    fil_no = :fil_no,\n" +
            "    fil_year = :fil_year,\n" +
            "    reg_no = :reg_no,\n" +
            "    reg_year = :reg_year,\n" +
            "    date_first_list = :date_first_list,\n" +
            "    date_next_list = :date_next_list,\n" +
            "    pend_disp = :pend_disp,\n" +
            "    date_of_decision = :date_of_decision,\n" +
            "    disp_reason = :disp_reason,\n" +
            "    disp_nature = :disp_nature,\n" +
            "    desgname = :desgname,\n" +
            "    court_no = :court_no,\n" +
            "    est_code = :est_code,\n" +
            "    state_code = :state_code,\n" +
            "    dist_code = :dist_code,\n" +
            "    purpose_code = :purpose_code,\n" +
            "    pet_name = :pet_name,\n" +
            "    pet_adv = :pet_adv,\n" +
            "    pet_adv_cd = :pet_adv_cd,\n" +
            "    res_name = :res_name,\n" +
            "    res_adv = :res_adv,\n" +
            "    res_adv_cd = :res_adv_cd,\n" +
            "    pet_adv_bar_reg = :pet_adv_bar_reg,\n" +
            "    res_adv_bar_reg = :res_adv_bar_reg,\n" +
            "    police_st_code = :police_st_code,\n" +
            "    police_ncode = :police_ncode,\n" +
            "    fir_no = :fir_no,\n" +
            "    police_station = :police_station,\n" +
            "    fir_year = :fir_year,\n" +
            "    date_last_list = :date_last_list,\n" +
            "    main_matter_cino = :main_matter_cino,\n" +
            "    pet_extra_party = :pet_extra_party,\n" +
            "    res_extra_party = :res_extra_party,\n" +
            "    pet_age = :pet_age,\n" +
            "    res_age = :res_age,\n" +
            "    pet_address = :pet_address,\n" +
            "    res_address = :res_address,\n" +
            "    jocode = :jocode,\n" +
            "    cicri_type = :cicri_type,\n" +
            "    act = :act,\n" +
            "    historyofcasehearing = :historyofcasehearing,\n" +
            "    interimorder = :interimorder,\n" +
            "    iafiling = :iafiling\n" +
            "WHERE cino = :cino;\n";

    public String insertQuery(){
        return INSERT_QUERY;
    }

    public String updateQuery(){
        return UPDATE_QUERY;
    }
}
