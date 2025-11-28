package com.dristi.njdg_transformer.repository;

import com.dristi.njdg_transformer.model.AdvocateDetails;
import com.dristi.njdg_transformer.model.AdvocateSerialNumber;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Types;
import java.util.List;

@Repository
@Slf4j
public class AdvocateRepository {
    
    private final JdbcTemplate jdbcTemplate;
    
    public AdvocateRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }


    public AdvocateDetails getAdvocateDetails(String advocateId) {
        String sql = "SELECT advocate_name AS advocateName, advocate_code AS advocateCode, " +
                "bar_reg_no AS barRegNo, advocate_id AS advocateId, email, phone, address, dob " +
                "FROM advocate_master WHERE advocate_id = ?";
        try {
            return jdbcTemplate.queryForObject(
                    sql,
                    new Object[]{advocateId},
                    new int[]{Types.VARCHAR},
                    new BeanPropertyRowMapper<>(AdvocateDetails.class)
            );
        } catch (EmptyResultDataAccessException e) {
            log.warn("No advocate found for ID: {}", advocateId);
            return null; // or an Optional.empty() if you prefer Optional
        }
    }


    public List<AdvocateDetails> getAllAdvocates() {
        String sql = "SELECT advocate_name as advocateName, advocate_code as advocateCode, bar_reg_no as barRegNo, advocate_id as advocateId, email, phone, address, dob FROM advocate_master ORDER BY advocate_code ASC";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AdvocateDetails.class));
    }

    public void insertAdvocateDetails(AdvocateDetails advocateDetails) {
        String sql = "INSERT INTO advocate_master (advocate_name, bar_reg_no, advocate_id, email, phone, address, dob) VALUES (?, ?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, 
            advocateDetails.getAdvocateName(), 
            advocateDetails.getBarRegNo(),
            advocateDetails.getAdvocateId(),
            advocateDetails.getEmail(),
            advocateDetails.getPhone(),
            advocateDetails.getAddress(),
            advocateDetails.getDob());
    }

    public void updateAdvocateDetails(AdvocateDetails advocateDetails) {
        String sql = """
        UPDATE advocate_master
        SET advocate_name = ?,
            bar_reg_no = ?,
            email = ?,
            phone = ?,
            address = ?,
            dob = ?
        WHERE advocate_code = ? AND advocate_id = ?
        """;

        int rowsUpdated = jdbcTemplate.update(sql,
                advocateDetails.getAdvocateName(),
                advocateDetails.getBarRegNo(),
                advocateDetails.getEmail(),
                advocateDetails.getPhone(),
                advocateDetails.getAddress(),
                advocateDetails.getDob(),
                advocateDetails.getAdvocateCode(),
                advocateDetails.getAdvocateId()
        );
        if (rowsUpdated > 0) {
            log.info("Successfully updated advocate with Code: {}, ID: {}",
                    advocateDetails.getAdvocateCode(), advocateDetails.getAdvocateId());
        } else {
            log.warn("No advocate found to update with Code: {}, ID: {}",
                    advocateDetails.getAdvocateCode(), advocateDetails.getAdvocateId());
        }
    }
}
