package org.pucar.dristi.repository.rowMapper;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.web.models.CaseSummary;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.CASE_SUMMARY_RESULT_SET_EXCEPTION;
import static org.pucar.dristi.config.ServiceConstants.ROW_MAPPER_EXCEPTION;

@Component
@Slf4j
public class CaseSummaryRowMapper implements ResultSetExtractor<List<CaseSummary>> {

    public List<CaseSummary> extractData(ResultSet rs) {
        Map<String,CaseSummary> caseSummaryMap = new LinkedHashMap<>();

        try {
            while (rs.next()) {
                CaseSummary caseSummary = CaseSummary.builder()
                        .resolutionMechanism(rs.getString("resolutionmechanism"))
                        .caseTitle(rs.getString("casetitle"))
                        .caseDescription(rs.getString("casedescription"))
                        .filingNumber(rs.getString("filingnumber"))
                        .courCaseNumber(rs.getString("courtcasenumber"))
                        .cnrNumber(rs.getString("cnrnumber"))
                        .filingDate(rs.getLong("filingdate"))
                        .registrationDate(rs.getString("registrationdate"))
                        .caseDetails(rs.getString("casedetails"))
                        .caseCategory(rs.getString("casecategory"))
                        .status(rs.getString("status"))
                        .remarks(rs.getString("remarks"))
                        .build();
                caseSummaryMap.put(caseSummary.getFilingNumber(), caseSummary);
            }
            return caseSummaryMap.values().stream().toList();
        } catch (SQLException e) {
            log.error("Error while mapping case summary row: {}", e.getMessage());
            throw new CustomException(ROW_MAPPER_EXCEPTION, CASE_SUMMARY_RESULT_SET_EXCEPTION + e.getMessage());
        }
    }
}
