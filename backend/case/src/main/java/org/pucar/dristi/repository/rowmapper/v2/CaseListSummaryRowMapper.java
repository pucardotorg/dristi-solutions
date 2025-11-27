package org.pucar.dristi.repository.rowmapper.v2;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.web.models.PendingAdvocateRequest;
import org.pucar.dristi.web.models.NatureOfDisposal;
import org.pucar.dristi.web.models.v2.CaseSummaryList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.io.IOException;
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

    private NatureOfDisposal getNatureOfDisposal(ResultSet rs) throws SQLException {
        try {
            String str = rs.getString("natureofdisposal");
            if (str == null || str.isEmpty()) return null;
            return NatureOfDisposal.valueOf(str);
        } catch (SQLException e) {
            log.error("Error reading natureofdisposal column from ResultSet", e);
            return null;
        } catch (IllegalArgumentException e) {
            log.error("Invalid NatureOfDisposal value in database: {}", rs.getString("natureofdisposal"), e);
            return null;
        }
    }

    @Override
    public List<CaseSummaryList> extractData(ResultSet rs) throws SQLException, DataAccessException {


        Map<String, CaseSummaryList> caseMap = new LinkedHashMap<>();

        while (rs.next()) {
            String caseId = rs.getString("id");
            CaseSummaryList caseSummary = caseMap.get(caseId);
            if (caseSummary == null) {
                caseSummary = CaseSummaryList.builder()
                        .id(caseId)
                        .tenantId(rs.getString("tenantid"))
                        .caseTitle(rs.getString("casetitle"))
                        .filingDate(rs.getLong("filingdate"))
                        .createdTime(rs.getLong("createdtime"))
                        .outcome(rs.getString("outcome"))
                        .status(rs.getString("status"))
                        .natureOfDisposal(getNatureOfDisposal(rs))
                        .substage(rs.getString("substage"))
                        .courtCaseNumber(rs.getString("courtcasenumber"))
                        .cnrNumber(rs.getString("cnrnumber"))
                        .cmpNumber(rs.getString("cmpnumber"))
                        .caseNumber(rs.getString("casenumber"))
                        .pendingAdvocateRequests(getObjectListFromJson(rs.getString("pendingadvocaterequests"), new TypeReference<List<PendingAdvocateRequest>>() {}))
                        .courtId(rs.getString("courtid"))
                        .filingNumber(rs.getString("filingnumber"))
                        .lastModifiedTime(rs.getLong("lastmodifiedtime"))
                        .isLPRCase(rs.getBoolean("isLPRCase"))
                        .lprNumber(rs.getString("lprNumber"))
                        .build();

                caseMap.put(caseId, caseSummary);
            }
        }

        return new ArrayList<>(caseMap.values());
    }

    public <T> T getObjectListFromJson(String json, TypeReference<T> typeRef) {
        if (json == null || json.trim().isEmpty()) {
            try {
                return objectMapper.readValue("[]", typeRef); // Return an empty object of the specified type
            } catch (IOException e) {
                throw new CustomException("Failed to create an empty instance of " + typeRef.getType(), e.getMessage());
            }
        }
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (Exception e) {
            throw new CustomException("Failed to convert JSON to " + typeRef.getType(), e.getMessage());
        }
    }
}
