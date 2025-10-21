package com.dristi.njdg_transformer.repository;

import com.dristi.njdg_transformer.model.HearingDetails;
import com.dristi.njdg_transformer.model.hearing.Hearing;
import com.dristi.njdg_transformer.repository.querybuilder.HearingQueryBuilder;
import com.dristi.njdg_transformer.repository.rowmapper.HearingDetailsRowMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class HearingRepository {

    private final JdbcTemplate jdbcTemplate;
    private final HearingQueryBuilder hearingQueryBuilder;

    public List<HearingDetails> getHearingDetailsByCino(String cino) {
        String hearingSearchQuery = hearingQueryBuilder.getHearingQuery(cino);
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgsList = new ArrayList<>();
        preparedStmtList.add(cino);
        preparedStmtArgsList.add(Types.VARCHAR);
        return jdbcTemplate.query(hearingSearchQuery, preparedStmtList.toArray(), preparedStmtArgsList.stream().mapToInt(Integer::intValue).toArray(), new HearingDetailsRowMapper());
    }

    public HearingDetails insertHearingDetails(HearingDetails hearingDetails) {
        String insertQuery = hearingQueryBuilder.getHearingInsertQuery();
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgsList = new ArrayList<>();
        preparedStmtList.add(hearingDetails.getId());
        preparedStmtList.add(hearingDetails.getCino());
        preparedStmtList.add(hearingDetails.getSrNo());
        preparedStmtList.add(hearingDetails.getDesgName());
        preparedStmtList.add(hearingDetails.getHearingDate());
        preparedStmtList.add(hearingDetails.getNextDate());
        preparedStmtList.add(hearingDetails.getPurposeOfListing());
        preparedStmtList.add(hearingDetails.getJudgeCode());
        preparedStmtList.add(hearingDetails.getJoCode());
        preparedStmtList.add(hearingDetails.getDesgCode());
        preparedStmtArgsList.add(Types.INTEGER);
        preparedStmtArgsList.add(Types.VARCHAR);
        preparedStmtArgsList.add(Types.INTEGER);
        preparedStmtArgsList.add(Types.VARCHAR);
        preparedStmtArgsList.add(Types.DATE);
        preparedStmtArgsList.add(Types.DATE);
        preparedStmtArgsList.add(Types.VARCHAR);
        preparedStmtArgsList.add(Types.INTEGER);
        preparedStmtArgsList.add(Types.INTEGER);
        preparedStmtArgsList.add(Types.INTEGER);
        jdbcTemplate.update(insertQuery, preparedStmtList.toArray(), preparedStmtArgsList.stream().mapToInt(Integer::intValue).toArray());
        return hearingDetails;
    }

    public Integer getHearingPurposeCode(Hearing hearing) {
        String hearingQuery = hearingQueryBuilder.getHearingPurposeQuery();
        String purpose = hearing.getHearingType();
        return jdbcTemplate.queryForObject(hearingQuery, new Object[]{purpose}, new int[]{Types.VARCHAR}, Integer.class);
    }
}
