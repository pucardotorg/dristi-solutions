package com.dristi.njdg_transformer.repository;

import com.dristi.njdg_transformer.repository.querybuilder.CaseQueryBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Types;

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
        return jdbcTemplate.queryForObject(query, new Object[]{districtName}, new int[]{Types.VARCHAR}, Integer.class);
    }
}
