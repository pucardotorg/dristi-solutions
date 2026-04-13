package com.egov.icops_integrationkerala.repository;

import com.egov.icops_integrationkerala.model.IcopsTracker;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@Slf4j
public class IcopsRepository {

    private final JdbcTemplate jdbcTemplate;

    private final IcopsQueryBuilder queryBuilder;

    private final IcopsRowMapper rowMapper;

    private final ObjectMapper mapper;

    @Autowired
    public IcopsRepository(JdbcTemplate jdbcTemplate, IcopsQueryBuilder queryBuilder, IcopsRowMapper rowMapper, ObjectMapper mapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.queryBuilder = queryBuilder;
        this.rowMapper = rowMapper;
        this.mapper = mapper;
    }

    public List<IcopsTracker> getIcopsTracker(String processUniqueId){
        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getIcopsTracker(processUniqueId, preparedStmtList);
        log.info("Final query: " + query);
        return jdbcTemplate.query(query, rowMapper, preparedStmtList.toArray());
    }

    public void updateResponseBlob(String processNumber, Object responseBlob) {
        String query = queryBuilder.getUpdateResponseBlobQuery();
        try {
            String responseBlobJson = mapper.writeValueAsString(responseBlob);
            PGobject pgObj = new PGobject();
            pgObj.setType("jsonb");
            pgObj.setValue(responseBlobJson);
            jdbcTemplate.update(query, pgObj, processNumber);
        } catch (Exception e) {
            log.error("Failed to update response_blob in DB", e);
        }
    }
}
