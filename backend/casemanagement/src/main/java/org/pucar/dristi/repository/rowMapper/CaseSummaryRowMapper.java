package org.pucar.dristi.repository.rowMapper;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.web.models.CaseSummary;
import org.pucar.dristi.web.models.Order;
import org.pucar.dristi.web.models.StatuteSection;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

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
                        .judgement(getJudgment(rs))
                        .statutesAndSections(new ArrayList<>())
                        .build();
                caseSummaryMap.put(caseSummary.getFilingNumber(), caseSummary);
                StatuteSection statuteSection = getStatuteSection(rs);
                if (statuteSection != null) {
                    caseSummary.addStatutesAndSectionsItem(statuteSection);
                }
            }
            return caseSummaryMap.values().stream().toList();
        } catch (SQLException e) {
            log.error("Error while mapping case summary row: {}", e.getMessage());
            throw new CustomException(ROW_MAPPER_EXCEPTION, CASE_SUMMARY_RESULT_SET_EXCEPTION + e.getMessage());
        }
    }

    private Order getJudgment(ResultSet rs) throws SQLException {
        return Order.builder()
                .id(UUID.fromString(rs.getString("orderid")))
                .tenantId(rs.getString("tenantid"))
                .filingNumber(rs.getString("filingnumber"))
                .cnrNumber(rs.getString("ordercnrnumber"))
                .applicationNumber(stringToList(rs.getString("applicationnumber")))
                .hearingNumber(rs.getString("hearingnumber"))
                .orderNumber(rs.getString("ordernumber"))
                .linkedOrderNumber(rs.getString("linkedordernumber"))
                .createdDate(rs.getLong("createddate"))
                .orderType(rs.getString("ordertype"))
                .orderCategory(rs.getString("ordercategory"))
                .status(rs.getString("orderstatus"))
                .comments(rs.getString("comments"))
                .isActive(rs.getBoolean("isactive"))
                .additionalDetails(rs.getString("additionaldetails"))
                .build();
    }

    private StatuteSection getStatuteSection(ResultSet rs) throws SQLException {
        String statuteId = rs.getString("statue_id");
        if (statuteId == null) {
            return null;
        }

        Long lastModifiedTime = rs.getLong("lastmodifiedtime");

        AuditDetails auditdetails = AuditDetails.builder()
                .createdBy(rs.getString("createdby"))
                .createdTime(rs.getLong("createdtime"))
                .lastModifiedBy(rs.getString("lastmodifiedby"))
                .lastModifiedTime(lastModifiedTime)
                .build();

        return StatuteSection.builder()
                .id(UUID.fromString(statuteId))
                .tenantId(rs.getString("statue_tenantid"))
                .statute(rs.getString("statutes"))
                .sections(stringToList(rs.getString("sections")))
                .subsections(stringToList(rs.getString("subsections")))
                .additionalDetails(rs.getString("statute_additionalDetails"))
                .auditdetails(auditdetails)
                .build();
    }

    public List<String> stringToList(String str){
        List<String> list = new ArrayList<>();
        if(str!=null){
            StringTokenizer st = new StringTokenizer(str,",");
            while (st.hasMoreTokens()) {
                list.add(st.nextToken());
            }
        }

        return list;
    }
}
