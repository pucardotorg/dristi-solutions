package com.dristi.njdg_transformer.repository;

import com.dristi.njdg_transformer.model.*;
import com.dristi.njdg_transformer.model.enums.PartyType;
import com.dristi.njdg_transformer.repository.querybuilder.CaseQueryBuilder;
import com.dristi.njdg_transformer.repository.rowmapper.AdvocateRowMapper;
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
import java.time.LocalDate;
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
        try {
            String query = queryBuilder.getPoliceStationQuery();
            return jdbcTemplate.queryForObject(query, new Object[]{policeStationCode}, new int[]{Types.VARCHAR}, new BeanPropertyRowMapper<>(PoliceStationDetails.class));
        } catch (Exception e) {
            log.info("Police station not found for code:: {}", policeStationCode);
            return null;
        }
    }

    public List<JudgeDetails> getJudge(LocalDate searchDate) {
        String query = queryBuilder.getJudgeMasterQuery();
        try {
            return jdbcTemplate.query(
                    query,
                    new Object[]{
                            java.sql.Date.valueOf(searchDate),
                            java.sql.Date.valueOf(searchDate)
                    },
                    new int[]{
                            Types.DATE,
                            Types.DATE
                    },
                    new BeanPropertyRowMapper<>(JudgeDetails.class)
            );
        } catch (EmptyResultDataAccessException e) {
            log.warn("No judges active on date: {}", searchDate);
            return List.of();
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

    public List<ExtraAdvocateDetails> getExtraAdvocateDetails(String cino, Integer partyType) {
        String query = queryBuilder.getExtraAdvocateDetailsCountQuery();
        return jdbcTemplate.query(query, new Object[]{cino, partyType}, new int[]{Types.VARCHAR, Types.INTEGER}, new AdvocateRowMapper());
    }
    public void updateExtraParties(PartyDetails partyDetails) {
        // First, check if the record exists based on a logical unique key
        String checkQuery = "SELECT id FROM extra_parties WHERE cino = ? AND party_type = ? AND party_no = ?";

        List<Integer> ids = jdbcTemplate.queryForList(checkQuery, Integer.class,
                partyDetails.getCino(),
                partyDetails.getPartyType().toString(),
                partyDetails.getPartyNo());

        if (!ids.isEmpty()) {
            // Record exists → UPDATE
            String updateQuery = "UPDATE extra_parties SET " +
                    "party_name = ?, party_address = ?, party_age = ?, party_id = ?, adv_cd = ?, adv_name = ?, sr_no = ? " +
                    "WHERE id = ?";

            jdbcTemplate.update(updateQuery,
                    partyDetails.getPartyName(),
                    partyDetails.getPartyAddress(),
                    partyDetails.getPartyAge() != null ? partyDetails.getPartyAge() : 0,
                    partyDetails.getPartyId(),
                    partyDetails.getAdvCd() != null ? partyDetails.getAdvCd() : 0,
                    partyDetails.getAdvName(),
                    partyDetails.getSrNo(),
                    ids.get(0));
        } else {
            // Record does not exist → INSERT
            String insertQuery = "INSERT INTO extra_parties (" +
                    "cino, party_type, party_no, party_name, party_address, party_age, party_id, adv_cd, adv_name, sr_no" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            jdbcTemplate.update(insertQuery,
                    partyDetails.getCino(),
                    partyDetails.getPartyType().toString(),
                    partyDetails.getPartyNo(),
                    partyDetails.getPartyName(),
                    partyDetails.getPartyAddress(),
                    partyDetails.getPartyAge() != null ? partyDetails.getPartyAge() : 0,
                    partyDetails.getPartyId(),
                    partyDetails.getAdvCd() != null ? partyDetails.getAdvCd() : 0,
                    partyDetails.getAdvName(),
                    partyDetails.getSrNo());
        }
    }

    public void updateExtraAdvocates(ExtraAdvocateDetails extraAdvocate) {
        // Check if this advocate already exists for the same party
        String checkQuery = "SELECT id FROM extra_advocates WHERE cino = ? AND party_no = ? AND sr_no = ?";

        List<Integer> ids = jdbcTemplate.queryForList(checkQuery, Integer.class,
                extraAdvocate.getCino(),
                extraAdvocate.getPartyNo(),
                extraAdvocate.getSrNo());

        if (!ids.isEmpty()) {
            // Record exists → UPDATE
            String updateQuery = "UPDATE extra_advocates SET " +
                    "pet_res_name = ?, type = ?, adv_name = ?, adv_code = ? " +
                    "WHERE id = ?";

            jdbcTemplate.update(updateQuery,
                    extraAdvocate.getPetResName(),
                    extraAdvocate.getType(),
                    extraAdvocate.getAdvName(),
                    extraAdvocate.getAdvCode(),
                    ids.get(0));
        } else {
            // Record does not exist → INSERT
            String insertQuery = "INSERT INTO extra_advocates (" +
                    "party_no, cino, pet_res_name, type, adv_name, adv_code, sr_no" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?)";

            jdbcTemplate.update(insertQuery,
                    extraAdvocate.getPartyNo(),
                    extraAdvocate.getCino(),
                    extraAdvocate.getPetResName(),
                    extraAdvocate.getType(),
                    extraAdvocate.getAdvName(),
                    extraAdvocate.getAdvCode(),
                    extraAdvocate.getSrNo());
        }
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
                record.getDispReason() != null ? record.getDispReason() : 0,
                record.getDispNature() != null ? record.getDispNature() : 0,
                record.getDesgname(),
                record.getCourtNo(),
                record.getEstCode(),
                record.getStateCode(),
                record.getDistCode(),
                record.getPurposeCode(),
                record.getPurposeNext(),
                record.getPurposePrevious(),
                record.getPetName(),
                record.getPetAdv(),
                record.getPetAdvCd() != null ? record.getPetAdvCd() : 0,
                record.getResName(),
                record.getResAdv(),
                record.getResAdvCd() != null ? record.getResAdvCd() : 0,
                record.getPetAdvBarReg(),
                record.getResAdvBarReg(),
                record.getPoliceStCode(),
                record.getPoliceNcode(),
                record.getFirNo(),
                record.getPoliceStation(),
                record.getFirYear(),
                record.getDateLastList(),
                record.getMainMatterCino(),
                record.getPetAge() != null ? record.getPetAge() : 0,
                record.getResAge() != null ? record.getResAge() : 0,
                record.getPetAddress(),
                record.getResAddress(),
                record.getJocode(),
                record.getCicriType() != null ? record.getCicriType() : '0',
                record.getJudgeCode(),
                record.getDesigCode(),
                record.getCino()
            );
            
            log.info("Updated {} record(s) with CINO: {}", updated, record.getCino());
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
                    record.getDispReason() != null ? record.getDispReason() : 0,
                    record.getDispNature() != null ? record.getDispNature() : 0,
                    record.getDesgname(),
                    record.getCourtNo(),
                    record.getEstCode(),
                    record.getStateCode(),
                    record.getDistCode(),
                    record.getPurposeCode(),
                    record.getPurposeNext(),
                    record.getPurposePrevious(),
                    record.getPetName(),
                    record.getPetAdv(),
                    record.getPetAdvCd()!=null ? record.getPetAdvCd() : 0,
                    record.getResName(),
                    record.getResAdv(),
                    record.getResAdvCd() != null ? record.getResAdvCd() : 0,
                    record.getPetAdvBarReg(),
                    record.getResAdvBarReg(),
                    record.getPoliceStCode(),
                    record.getPoliceNcode(),
                    record.getFirNo(),
                    record.getPoliceStation(),
                    record.getFirYear(),
                    record.getDateLastList(),
                    record.getMainMatterCino(),
                    record.getPetAge() != null ? record.getPetAge() : 0,
                    record.getResAge() != null ? record.getResAge() : 0,
                    record.getPetAddress(),
                    record.getResAddress(),
                    record.getJocode(),
                    record.getCicriType() != null ? record.getCicriType().toString() : '0',
                    record.getJudgeCode(),
                    record.getDesigCode()
            );

            log.info("Inserted {} record(s) with CINO: {}", inserted, record.getCino());
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

    public void upsertActDetails(Act act) {
        try {
            // Fetch only by primary key (id)
            String selectQuery = "SELECT id FROM acts WHERE cino = ?";;
            List<Integer> existingIds = jdbcTemplate.query(
                    selectQuery,
                    new Object[]{act.getCino()},
                    (rs, rowNum) -> rs.getInt("id")
            );

            if (existingIds.isEmpty()) {
                // INSERT
                String insertQuery = queryBuilder.getInsertActQuery();
                int inserted = jdbcTemplate.update(insertQuery,
                        act.getCino(),
                        act.getActCode(),
                        act.getActName(),
                        act.getActSection(),
                        act.getSrNo());
                log.info("Inserted {} record(s) for Act with ID: {}", inserted, act.getId());
            } else {
                // UPDATE
                String updateQuery = queryBuilder.getUpdateActQuery();
                int updated = jdbcTemplate.update(updateQuery,
                        act.getActCode(),
                        act.getActName(),
                        act.getActSection(),
                        act.getSrNo(),
                        act.getCino());
                log.info("Updated {} record(s) for Act with ID: {}", updated, act.getId());
            }

        } catch (DataAccessException e) {
            log.error("Database error while upserting Act with ID {}: {}", act.getId(), e.getMessage(), e);
            throw new RuntimeException("Error upserting Act record", e);
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
