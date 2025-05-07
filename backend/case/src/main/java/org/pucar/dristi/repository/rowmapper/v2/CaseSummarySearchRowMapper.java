package org.pucar.dristi.repository.rowmapper.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.web.models.v2.CaseSummarySearch;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

@Component
@Slf4j
public class CaseSummarySearchRowMapper implements ResultSetExtractor<List<CaseSummarySearch>> {

    private final ObjectMapper objectMapper;

    @Autowired
    public CaseSummarySearchRowMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public List<CaseSummarySearch> extractData(ResultSet rs) throws SQLException, DataAccessException {

        Map<UUID, CaseSummarySearch> caseMap = new HashMap<>();

        while (rs.next()) {
            UUID caseId = UUID.fromString(rs.getString("id"));
            CaseSummarySearch caseSummary = caseMap.get(caseId);
            if (caseSummary == null) {
                caseSummary = CaseSummarySearch.builder()
                        .caseId(caseId)
                        .tenantId(rs.getString("tenantid"))
                        .caseTitle(rs.getString("casetitle"))
                        .filingDate(rs.getLong("filingdate"))
                        .stage(rs.getString("stage"))
                        .caseType(rs.getString("casetype"))
                        .caseNumber(rs.getString("casenumber"))
                        .filingNumber(rs.getString("filingnumber"))
                        .build();

                caseMap.put(caseId, caseSummary);
            }
        }

        return new ArrayList<>(caseMap.values());
    }
}
