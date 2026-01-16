package org.pucar.dristi.repository.rowmapper.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.pucar.dristi.web.models.NatureOfDisposal;
import org.pucar.dristi.web.models.v2.CaseSummarySearch;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.ROW_MAPPER_EXCEPTION;

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

        Map<UUID, CaseSummarySearch> caseMap = new LinkedHashMap<>();
        try {
            while (rs.next()) {
                UUID caseId = UUID.fromString(rs.getString("id"));
                CaseSummarySearch caseSummary = caseMap.get(caseId);

                if (caseSummary == null) {
                    caseSummary = CaseSummarySearch.builder()
                            .id(UUID.fromString(rs.getString("id")))
                            .tenantId(rs.getString("tenantid"))
                            .resolutionMechanism(rs.getString("resolutionmechanism"))
                            .caseTitle(rs.getString("casetitle"))
                            .caseDescription(rs.getString("casedescription"))
                            .filingNumber(rs.getString("filingnumber"))
                            .createdTime(rs.getLong("createdtime"))
                            .caseNumber(rs.getString("casenumber"))
                            .cnrNumber(rs.getString("cnrnumber"))
                            .courtCaseNumber(rs.getString("courtcasenumber"))
                            .outcome(rs.getString("outcome"))
                            .natureOfDisposal(getNatureOfDisposal(rs))
                            .caseType(rs.getString("casetype"))
                            .courtId(rs.getString("courtid"))
                            .benchId(rs.getString("benchid"))
                            .cmpNumber(rs.getString("cmpnumber"))
                            .judgeId(rs.getString("judgeid"))
                            .stage(rs.getString("stage"))
                            .substage(rs.getString("substage"))
                            .advocateCount(rs.getInt("advocatecount"))
                            .filingDate(parseDateToLong(rs.getString("filingdate")))
                            .judgementDate(parseDateToLong(rs.getString("judgementdate")))
                            .registrationDate(parseDateToLong(rs.getString("registrationdate")))
                            .caseCategory(rs.getString("casecategory"))
                            .natureOfPleading(rs.getString("natureofpleading"))
                            .status(rs.getString("status"))
                            .createdBy(rs.getString("createdby"))
                            .build();

                    PGobject pgObject = (PGobject) rs.getObject("additionaldetails");
                    if (pgObject != null)
                        caseSummary.setAdditionalDetails(objectMapper.readTree(pgObject.getValue()));

                    caseMap.put(caseId, caseSummary);
                }
            }

            return new ArrayList<>(caseMap.values());
        }catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while processing Case ResultSet :: {}", e.toString());
            throw new CustomException(ROW_MAPPER_EXCEPTION, "Exception occurred while processing Case ResultSet: " + e.getMessage());
        }
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

    private Long parseDateToLong(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        try {
            return Long.valueOf(dateStr);
        } catch (NumberFormatException e) {
            log.error("Invalid date format: {}", dateStr);
            throw new CustomException("INVALID_DATE_FORMAT",
                    "Date must be a valid timestamp: " + dateStr);
        }
    }
}
