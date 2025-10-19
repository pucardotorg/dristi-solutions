package com.dristi.njdg_transformer.repository;

import com.dristi.njdg_transformer.model.AdvocateDetails;
import com.dristi.njdg_transformer.model.AdvocateSerialNumber;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Types;

@Repository
public class AdvocateRepository {
    
    private final JdbcTemplate jdbcTemplate;
    
    public AdvocateRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }


    public AdvocateDetails getAdvocateDetails(String advocateId) {
        String sql = "SELECT advocate_name as advocateName, advocate_code as advocateCode, bar_reg_no as barRegNo, advocate_id as advocateId FROM advocate_master WHERE advocate_id = ?";
        return jdbcTemplate.queryForObject(sql, new Object[]{advocateId}, new int[]{Types.VARCHAR}, AdvocateDetails.class);
    }
}
