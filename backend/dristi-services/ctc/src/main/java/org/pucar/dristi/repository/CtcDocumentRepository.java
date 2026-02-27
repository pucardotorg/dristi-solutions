package org.pucar.dristi.repository;

import org.pucar.dristi.web.models.IssuedDocument;
import org.pucar.dristi.web.models.SelectedDocument;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.pucar.dristi.repository.querybuilder.CtcApplicationQueryBuilder;
import org.pucar.dristi.repository.rowmapper.CtcSelectedDocumentRowMapper;
import org.pucar.dristi.repository.rowmapper.CtcIssuedDocumentRowMapper;
import org.springframework.dao.DataAccessException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class CtcDocumentRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private CtcApplicationQueryBuilder queryBuilder;

    public List<SelectedDocument> getSelectedDocumentsByApplication(String applicationId) {
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("applicationId", applicationId);
            String query = queryBuilder.getSelectedDocumentsQuery(applicationId);
            return jdbcTemplate.query(query, params, new CtcSelectedDocumentRowMapper());
        } catch (DataAccessException e) {
            throw new RuntimeException("Error fetching selected documents", e);
        }
    }

    public List<IssuedDocument> getIssuedDocumentsByApplication(String applicationId) {
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("applicationId", applicationId);
            String query = queryBuilder.getIssuedDocumentsQuery(applicationId);
            return jdbcTemplate.query(query, params, new CtcIssuedDocumentRowMapper());
        } catch (DataAccessException e) {
            throw new RuntimeException("Error fetching issued documents", e);
        }
    }
}
