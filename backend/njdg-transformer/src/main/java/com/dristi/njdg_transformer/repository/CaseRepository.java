package com.dristi.njdg_transformer.repository;

import com.dristi.njdg_transformer.model.*;
import com.dristi.njdg_transformer.model.enums.PartyType;
import com.dristi.njdg_transformer.repository.querybuilder.CaseQueryBuilder;
import com.dristi.njdg_transformer.repository.rowmapper.NJDGTransformRecordRowMapper;
import com.dristi.njdg_transformer.repository.rowmapper.PartyRowMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

@Repository
@Slf4j
@RequiredArgsConstructor
public class CaseRepository {

    private final CaseQueryBuilder queryBuilder;
    private final JdbcTemplate jdbcTemplate;


    public Integer getCaseTypeCode(String caseType) {
        String query = queryBuilder.getCaseTypeQuery();
        return jdbcTemplate.queryForObject(query, new Object[]{caseType}, new int[]{Types.VARCHAR}, Integer.class);
    }

    public Integer getDisposalStatus(String outcome) {
        String query = queryBuilder.getDisposalTypeQuery();
        return jdbcTemplate.queryForObject(query, new Object[]{outcome}, new int[]{Types.VARCHAR}, Integer.class);
    }

    public Integer getDistrictCode(String districtName) {
        String query = queryBuilder.getDistrictQuery();
        try {
            return jdbcTemplate.queryForObject(
                    query,
                    new Object[]{districtName},
                    new int[]{Types.VARCHAR},
                    Integer.class
            );
        } catch (EmptyResultDataAccessException e) {
            log.warn("No district found for name: {}", districtName);
            return 2; //default 2 for Kollam district which can be configured for multi district
        }
    }


    public PoliceStationDetails getPoliceStationDetails(String policeStationCode) {
        String query = queryBuilder.getPoliceStationQuery();
        return jdbcTemplate.queryForObject(query, new Object[]{policeStationCode}, new int[]{Types.VARCHAR}, new BeanPropertyRowMapper<>(PoliceStationDetails.class));
    }

    public JudgeDetails getJudge(String judgeId) {
        String query = queryBuilder.getJudgeMasterQuery();
        try {
            return jdbcTemplate.queryForObject(
                    query,
                    new Object[]{judgeId},
                    new int[]{Types.VARCHAR},
                    new BeanPropertyRowMapper<>(JudgeDetails.class)
            );
        } catch (EmptyResultDataAccessException e) {
            log.warn("No judge found for ID: {}", judgeId);
            return null;
        }
    }


    public NJDGTransformRecord findByCino(String cino) {
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgsList = new ArrayList<>();
        String query = queryBuilder.getCaseQuery(cino, preparedStmtList, preparedStmtArgsList);
        try {
            return jdbcTemplate.queryForObject(
                    query,
                    preparedStmtList.toArray(),
                    preparedStmtArgsList.stream().mapToInt(Integer::intValue).toArray(),
                    new NJDGTransformRecordRowMapper()
            );
        } catch (EmptyResultDataAccessException e) {
            log.warn("No case found for cino: {}", cino);
            return null;
        } catch (Exception e) {
            log.error("Error finding case by cino: {}", cino, e);
            return null;
        }
    }


    public List<PartyDetails> getPartyDetails(String cino, PartyType partyType) {
        String partyQuery = queryBuilder.getPartyQuery();
        return jdbcTemplate.query(partyQuery, new Object[]{cino, partyType.toString()}, new int[]{Types.VARCHAR, Types.VARCHAR}, new PartyRowMapper());
    }

    public void updateExtraParties(PartyDetails partyDetails) {
        String updatePartyQuery = queryBuilder.getUpdatePartyQuery();
        jdbcTemplate.update(updatePartyQuery,
                new Object[]{
                        partyDetails.getId(),
                        partyDetails.getCino(),
                        partyDetails.getPartyType(),
                        partyDetails.getPartyNo(),
                        partyDetails.getPartyName(),
                        partyDetails.getPartyAddress(),
                        partyDetails.getPartyAge(),
                        partyDetails.getPartyId()
                },
                new int[]{
                        Types.INTEGER,
                        Types.VARCHAR,
                        Types.VARCHAR,
                        Types.INTEGER,
                        Types.VARCHAR,
                        Types.VARCHAR,
                        Types.INTEGER,
                        Types.VARCHAR
                }
        );
    }
    public void updateRecord(NJDGTransformRecord record) {
        String updateQuery = queryBuilder.getUpdateQuery();
        try {
            int updated = jdbcTemplate.update(updateQuery,
                record.getDateOfFiling(),
                record.getDtRegis(),
                record.getCaseType(),
                record.getFilNo(),
                record.getFilYear(),
                record.getRegNo(),
                record.getRegYear(),
                record.getDateFirstList(),
                record.getDateNextList(),
                record.getPendDisp() != null ? record.getPendDisp().toString() : null,
                record.getDateOfDecision(),
                record.getDispReason(),
                record.getDispNature() != null ? record.getDispNature().toString() : null,
                record.getDesgname(),
                record.getCourtNo(),
                record.getEstCode(),
                record.getStateCode(),
                record.getDistCode(),
                record.getPurposeCode(),
                record.getPetName(),
                record.getPetAdv(),
                record.getPetAdvCd(),
                record.getResName(),
                record.getResAdv(),
                record.getResAdvCd(),
                record.getPetAdvBarReg(),
                record.getResAdvBarReg(),
                record.getPoliceStCode(),
                record.getPoliceNcode(),
                record.getFirNo(),
                record.getPoliceStation(),
                record.getFirYear(),
                record.getDateLastList(),
                record.getMainMatterCino(),
                record.getPetAge(),
                record.getResAge(),
                record.getPetAddress(),
                record.getResAddress(),
                record.getJocode(),
                record.getCicriType() != null ? record.getCicriType() : null,
                record.getCino()
            );
            
            log.debug("Updated {} record(s) with CINO: {}", updated, record.getCino());
        } catch (Exception e) {
            log.error("Error updating record with CINO: {}. Error: {}", record.getCino(), e.getMessage(), e);
            throw new RuntimeException("Failed to update record", e);
        }
    }

    public void insertRecord(NJDGTransformRecord record) {
        String insertQuery = queryBuilder.getInsertQuery();
        try {
            int inserted = jdbcTemplate.update(insertQuery,
                    record.getCino(),
                    record.getDateOfFiling(),
                    record.getDtRegis(),
                    record.getCaseType(),
                    record.getFilNo(),
                    record.getFilYear(),
                    record.getRegNo(),
                    record.getRegYear(),
                    record.getDateFirstList(),
                    record.getDateNextList(),
                    record.getPendDisp() != null ? record.getPendDisp().toString() : null,
                    record.getDateOfDecision(),
                    record.getDispReason(),
                    record.getDispNature() != null ? record.getDispNature().toString() : null,
                    record.getDesgname(),
                    record.getCourtNo(),
                    record.getEstCode(),
                    record.getStateCode(),
                    record.getDistCode(),
                    record.getPurposeCode(),
                    record.getPetName(),
                    record.getPetAdv(),
                    record.getPetAdvCd(),
                    record.getResName(),
                    record.getResAdv(),
                    record.getResAdvCd(),
                    record.getPetAdvBarReg(),
                    record.getResAdvBarReg(),
                    record.getPoliceStCode(),
                    record.getPoliceNcode(),
                    record.getFirNo(),
                    record.getPoliceStation(),
                    record.getFirYear(),
                    record.getDateLastList(),
                    record.getMainMatterCino(),
                    record.getPetAge(),
                    record.getResAge(),
                    record.getPetAddress(),
                    record.getResAddress(),
                    record.getJocode(),
                    record.getCicriType() != null ? record.getCicriType().toString() : null
            );

            log.debug("Inserted {} record(s) with CINO: {}", inserted, record.getCino());
        } catch (Exception e) {
            log.error("Error inserting record with CINO: {}. Error: {}", record.getCino(), e.getMessage(), e);
            throw new RuntimeException("Failed to insert record", e);
        }
    }


    public List<Act> getActs(String cnrNumber) {
        String actSearchQuery = queryBuilder.getActQuery();

        Object[] params = new Object[]{cnrNumber};
        int[] types = new int[]{Types.VARCHAR};

        // Map rows to Act objects using BeanPropertyRowMapper
        return jdbcTemplate.query(
                actSearchQuery,
                params,
                types,
                new BeanPropertyRowMapper<>(Act.class)
        );
    }

    public Act getActMaster(String actName) {
        String actMasterQuery = queryBuilder.getActMasterQuery();
        Object[] params = new Object[]{actName};
        int[] types = new int[]{Types.VARCHAR};
        return jdbcTemplate.queryForObject(actMasterQuery, params, types, new BeanPropertyRowMapper<>(Act.class));
    }

    public void insertActDetails(Act act) {
        String insertActQuery = queryBuilder.getInsertActQuery();
        try {
            int inserted = jdbcTemplate.update(insertActQuery,
                    act.getId(),
                    act.getCino(),
                    act.getActCode(),
                    act.getActName(),
                    act.getActSection());
            log.debug("Inserted {} record(s) with CINO: {}", inserted, act.getCino());
        } catch (DataAccessException e) {
            throw new RuntimeException(e);
        }
    }

    public String getJudgeDesignation(String judgeDesignation) {
        String getJudgeDesignationQuery = queryBuilder.getJudgeDesignationQuery();
        Object[] params = new Object[]{judgeDesignation};
        int[] types = new int[]{Types.VARCHAR};
        return jdbcTemplate.queryForObject(getJudgeDesignationQuery, params, types, String.class);
    }

    public DesignationMaster getDesignationMaster(String judgeDesignation) {
        String getJudgeMasterQuery = queryBuilder.getDesignationMasterQuery();
        Object[] params = new Object[]{judgeDesignation};
        int[] types = new int[]{Types.VARCHAR};
        return jdbcTemplate.queryForObject(getJudgeMasterQuery, params, types, new BeanPropertyRowMapper<>(DesignationMaster.class));
    }

    public String getDisposalNature(String outcome) {
        String getDisposalNatureQuery = queryBuilder.getDisposalNatureQuery();
        Object[] params = new Object[]{outcome};
        int[] types = new int[]{Types.VARCHAR};
        return jdbcTemplate.queryForObject(getDisposalNatureQuery, params, types, String.class);
    }
}
