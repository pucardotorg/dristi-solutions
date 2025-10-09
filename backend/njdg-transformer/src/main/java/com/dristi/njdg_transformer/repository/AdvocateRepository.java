package com.dristi.njdg_transformer.repository;

import com.dristi.njdg_transformer.model.advocate.AdvocateSerialNumber;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public class AdvocateRepository {
    
    private final JdbcTemplate jdbcTemplate;
    
    public AdvocateRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    
    public AdvocateSerialNumber findAdvocateSerialNumber(String advocateId) {
        try {
            String sql = "SELECT serial_no as serialNo, advocate_id as advocateId, bar_reg_no as barRegNo " +
                       "FROM advocate_serial_numbers WHERE advocate_id = ?";
            return jdbcTemplate.queryForObject(
                sql,
                new Object[]{advocateId},
                new BeanPropertyRowMapper<>(AdvocateSerialNumber.class)
            );
        } catch (Exception e) {
            return null;
        }
    }
}
