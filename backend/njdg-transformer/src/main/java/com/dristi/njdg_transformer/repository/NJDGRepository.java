package com.dristi.njdg_transformer.repository;

import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.util.Collections;
import java.util.Map;

@Repository
@Slf4j
@Transactional
public class NJDGRepository {

    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    private final NJDGQueryBuilder njdgQueryBuilder;

    @Autowired
    public NJDGRepository(DataSource dataSource, NJDGQueryBuilder njdgQueryBuilder) {
        this.namedParameterJdbcTemplate = new NamedParameterJdbcTemplate(dataSource);
        this.njdgQueryBuilder = njdgQueryBuilder;
    }

    /**
     * Inserts a new NJDG transform record into the database
     * @param record The record to be inserted
     * @return The inserted record with any generated fields
     * @throws DataAccessException if there's an error executing the insert query
     * @throws IllegalArgumentException if the input record is null or missing required fields
     */
    public NJDGTransformRecord insertData(NJDGTransformRecord record) {
        if (record == null) {
            throw new IllegalArgumentException("NJDG transform record cannot be null");
        }
        if (record.getCino() == null || record.getCino().trim().isEmpty()) {
            throw new IllegalArgumentException("CINO (Case Identification Number) is required");
        }

        try {
            String insertQuery = njdgQueryBuilder.insertQuery();
            SqlParameterSource parameters = new BeanPropertySqlParameterSource(record);
            
            int rowsAffected = namedParameterJdbcTemplate.update(insertQuery, parameters);
            
            if (rowsAffected == 0) {
                log.warn("No rows were inserted for record with CINO: {}", record.getCino());
                throw new DataAccessException("Failed to insert record with CINO: " + record.getCino()) {};
            }
            
            log.debug("Successfully inserted record with CINO: {}", record.getCino());
            return record;
            
        } catch (DataAccessException e) {
            log.error("Database error while inserting record with CINO: {}. Error: {}", 
                     record.getCino(), e.getMessage(), e);
            throw new DataAccessException("Failed to insert NJDG transform record: " + e.getMessage(), e) {};
        }
    }

    /**
     * Updates an existing NJDG transform record in the database
     * @param record The record with updated values
     * @return The updated record
     * @throws DataAccessException if there's an error executing the update query
     * @throws IllegalArgumentException if the input record is null or missing required fields
     */
    public NJDGTransformRecord updateData(NJDGTransformRecord record) {
        if (record == null) {
            throw new IllegalArgumentException("NJDG transform record cannot be null");
        }
        if (record.getCino() == null || record.getCino().trim().isEmpty()) {
            throw new IllegalArgumentException("CINO (Case Identification Number) is required for update");
        }

        try {
            String updateQuery = njdgQueryBuilder.updateQuery();
            SqlParameterSource parameters = new BeanPropertySqlParameterSource(record);
            
            int rowsAffected = namedParameterJdbcTemplate.update(updateQuery, parameters);
            
            if (rowsAffected == 0) {
                log.warn("No records were updated for CINO: {}", record.getCino());
                throw new DataAccessException("No record found with CINO: " + record.getCino()) {};
            }
            
            log.debug("Successfully updated record with CINO: {}", record.getCino());
            return record;
            
        } catch (DataAccessException e) {
            log.error("Database error while updating record with CINO: {}. Error: {}", 
                     record.getCino(), e.getMessage(), e);
            throw new DataAccessException("Failed to update NJDG transform record: " + e.getMessage(), e) {};
        }
    }
    
    /**
     * Finds a record by its CINO (Case Identification Number)
     * 
     * @param cino The Case Identification Number to search for
     * @return The found record, or null if not found
     * @throws IllegalArgumentException if cino is null or empty
     */
    public NJDGTransformRecord findByCino(String cino) {
        if (cino == null || cino.trim().isEmpty()) {
            throw new IllegalArgumentException("CINO cannot be null or empty");
        }
        
        try {
            String sql = "SELECT * FROM njdg_transform_record WHERE cino = :cino";
            Map<String, Object> params = Collections.singletonMap("cino", cino);
            
            return namedParameterJdbcTemplate.queryForObject(
                sql,
                params,
                new BeanPropertyRowMapper<>(NJDGTransformRecord.class)
            );
        } catch (EmptyResultDataAccessException e) {
            log.debug("No record found with CINO: {}", cino);
            return null;
        } catch (Exception e) {
            log.error("Error finding record with CINO: {}. Error: {}", cino, e.getMessage(), e);
            throw new DataAccessException("Error finding record with CINO: " + cino, e) {};
        }
    }
    
    /**
     * Checks if a record with the given CINO exists in the database
     * 
     * @param cino The Case Identification Number to check
     * @return true if a record exists, false otherwise
     */
    public boolean existsByCino(String cino) {
        try {
            String sql = "SELECT COUNT(*) > 0 FROM njdg_transform_record WHERE cino = :cino";
            Map<String, Object> params = Collections.singletonMap("cino", cino);
            
            Boolean exists = namedParameterJdbcTemplate.queryForObject(sql, params, Boolean.class);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.error("Error checking if record exists with CINO: {}. Error: {}", cino, e.getMessage(), e);
            return false;
        }
    }
}
