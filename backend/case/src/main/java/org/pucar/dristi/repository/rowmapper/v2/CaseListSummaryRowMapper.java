package org.pucar.dristi.repository.rowmapper.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.web.models.v2.CaseSummaryList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

@Component
@Slf4j
public class CaseListSummaryRowMapper implements ResultSetExtractor<List<CaseSummaryList>> {

    private final ObjectMapper objectMapper;

    @Autowired
    public CaseListSummaryRowMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public List<CaseSummaryList> extractData(ResultSet rs) throws SQLException, DataAccessException {


        Map<String, CaseSummaryList> caseMap = new HashMap<>();

        while (rs.next()) {
            String caseId = rs.getString("id");
            CaseSummaryList caseSummary = caseMap.get(caseId);
            if (caseSummary == null) {
                caseSummary = CaseSummaryList.builder()
                        .id(caseId)
                        .tenantId(rs.getString("tenantid"))
                        .caseTitle(rs.getString("casetitle"))
                        .filingDate(rs.getLong("filingdate"))
                        .stage(rs.getString("stage"))
                        .outcome(rs.getString("outcome"))
                        .advocateCount(rs.getInt("advocatecount"))
                        .status(rs.getString("status"))
                        .substage(rs.getString("substage"))
                        .stage(rs.getString("stage"))
                        .courtCaseNumber(rs.getString("courtcasenumber"))
                        .cnrNumber(rs.getString("cnrnumber"))
                        .cmpNumber(rs.getString("cmpnumber"))
                        .caseNumber(rs.getString("casenumber"))
                        .courtId(rs.getString("courtid"))
                        .filingNumber(rs.getString("filingnumber"))
                        .lastModifiedTime(rs.getLong("lastmodifiedtime"))
                        .build();

                caseMap.put(caseId, caseSummary);
            }
        }

        return new ArrayList<>(caseMap.values());
    }
}
