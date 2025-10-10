package com.dristi.njdg_transformer.repository;

import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
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
    private final ObjectMapper objectMapper;

    @Autowired
    public NJDGRepository(DataSource dataSource, NJDGQueryBuilder njdgQueryBuilder, ObjectMapper objectMapper) {
        this.namedParameterJdbcTemplate = new NamedParameterJdbcTemplate(dataSource);
        this.njdgQueryBuilder = njdgQueryBuilder;
        this.objectMapper = objectMapper;
    }

    /**
     * Inserts a new NJDG transform record into the database
     * @param record The record to be inserted
     * @return The inserted record with any generated fields
     * @throws DataAccessException if there's an error executing the insert query
     * @throws IllegalArgumentException if the input record is null or missing required fields
     */
    public NJDGTransformRecord insertData(NJDGTransformRecord record) {
        if (record == null || record.getCino() == null || record.getCino().trim().isEmpty()) {
            throw new IllegalArgumentException("CINO (Case Identification Number) is required");
        }

        try {
            String insertQuery = njdgQueryBuilder.insertQuery();

            // Prepare parameters and handle JSONB fields
            MapSqlParameterSource params = getMapSqlParameterSource(record);

            int rowsAffected = namedParameterJdbcTemplate.update(insertQuery, params);
            if (rowsAffected == 0) {
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

    private PGobject toJsonb(Object obj) {
        if (obj == null) return null;
        try {
            PGobject jsonObject = new PGobject();
            jsonObject.setType("jsonb");
            jsonObject.setValue(objectMapper.writeValueAsString(obj));
            return jsonObject;
        } catch (Exception e) {
            throw new RuntimeException("Failed to convert to JSONB PGobject", e);
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
        if (record == null || record.getCino() == null || record.getCino().trim().isEmpty()) {
            throw new IllegalArgumentException("CINO (Case Identification Number) is required for update");
        }

        try {
            String updateQuery = njdgQueryBuilder.updateQuery();

            MapSqlParameterSource params = getMapSqlParameterSource(record);

            int rowsUpdated = namedParameterJdbcTemplate.update(updateQuery, params);
            if (rowsUpdated == 0) {
                throw new DataAccessException("No record found to update with CINO: " + record.getCino()) {};
            }

            log.debug("Successfully updated record with CINO: {}", record.getCino());
            return record;

        } catch (DataAccessException e) {
            log.error("Database error while updating record with CINO: {}. Error: {}", record.getCino(), e.getMessage(), e);
            throw new DataAccessException("Failed to update NJDG transform record: " + e.getMessage(), e) {};
        }
    }

    @NotNull
    private MapSqlParameterSource getMapSqlParameterSource(NJDGTransformRecord record) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("cino", record.getCino());
        params.addValue("dateOfFiling", record.getDateOfFiling());
        params.addValue("dtRegis", record.getDtRegis());
        params.addValue("caseType", record.getCaseType());
        params.addValue("filNo", record.getFilNo());
        params.addValue("filYear", record.getFilYear());
        params.addValue("regNo", record.getRegNo());
        params.addValue("regYear", record.getRegYear());
        params.addValue("dateFirstList", record.getDateFirstList());
        params.addValue("dateNextList", record.getDateNextList());
        params.addValue("pendDisp", record.getPendDisp());
        params.addValue("dateOfDecision", record.getDateOfDecision());
        params.addValue("dispReason", record.getDispReason());
        params.addValue("dispNature", record.getDispNature());
        params.addValue("desgname", record.getDesgname());
        params.addValue("courtNo", record.getCourtNo());
        params.addValue("estCode", record.getEstCode());
        params.addValue("stateCode", record.getStateCode());
        params.addValue("distCode", record.getDistCode());
        params.addValue("purposeCode", record.getPurposeCode());
        params.addValue("petName", record.getPetName());
        params.addValue("petAdv", record.getPetAdv());
        params.addValue("petAdvCd", record.getPetAdvCd());
        params.addValue("resName", record.getResName());
        params.addValue("resAdv", record.getResAdv());
        params.addValue("resAdvCd", record.getResAdvCd());
        params.addValue("petAdvBarReg", record.getPetAdvBarReg());
        params.addValue("resAdvBarReg", record.getResAdvBarReg());
        params.addValue("policeStCode", record.getPoliceStCode());
        params.addValue("policeNcode", record.getPoliceNcode());
        params.addValue("firNo", record.getFirNo());
        params.addValue("policeStation", record.getPoliceStation());
        params.addValue("firYear", record.getFirYear());
        params.addValue("dateLastList", record.getDateLastList());
        params.addValue("mainMatterCino", record.getMainMatterCino());

        // Convert List<JsonNode> → PGobject for JSONB
        params.addValue("petExtraParty", toJsonb(record.getPetExtraParty()));
        params.addValue("resExtraParty", toJsonb(record.getResExtraParty()));
        params.addValue("petAge", record.getPetAge());
        params.addValue("resAge", record.getResAge());
        params.addValue("petAddress", record.getPetAddress());
        params.addValue("resAddress", record.getResAddress());
        params.addValue("jocode", record.getJocode());
        params.addValue("cicriType", record.getCicriType());
        params.addValue("act", toJsonb(record.getAct()));
        params.addValue("historyOfCaseHearing", toJsonb(record.getHistoryOfCaseHearing()));
        params.addValue("interimOrder", toJsonb(record.getInterimOrder()));
        params.addValue("iaFiling", toJsonb(record.getIaFiling()));
        return params;
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

            return namedParameterJdbcTemplate.queryForObject(sql, params, new NJDGTransformRecordRowMapper());

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
