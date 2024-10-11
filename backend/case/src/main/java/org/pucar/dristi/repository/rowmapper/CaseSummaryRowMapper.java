package org.pucar.dristi.repository.rowmapper;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.web.models.*;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

@Component
@Slf4j
public class CaseSummaryRowMapper implements ResultSetExtractor<List<CaseSummary>> {


    @Override
    public List<CaseSummary> extractData(ResultSet rs) throws SQLException, DataAccessException {


        Map<String, CaseSummary> caseMap = new HashMap<>();

        while (rs.next()) {
            String caseId = rs.getString("id");
            CaseSummary caseSummary = caseMap.get(caseId);
            if (caseSummary == null) {
                caseSummary = CaseSummary.builder()
                        .id(caseId)
                        .tenantId(rs.getString("tenantid"))
                        .caseTitle(rs.getString("casetitle"))
                        .filingDate(rs.getLong("filingdate"))
                        .statutesAndSections(null) // connect with manimaran
                        .stage(rs.getString("stage"))
                        .subStage(rs.getString("substage"))
                        .outcome(rs.getString("outcome"))
                        .litigants(new ArrayList<>())
                        .representatives(new ArrayList<>())
                        .judge(getJudge(rs))
                        .build();

                caseMap.put(caseId, caseSummary);
            }

            String statuteId = rs.getString("statute_section_id");
            if (statuteId != null) {
                StatuteSection statuteSection = StatuteSection.builder()
                        .id(UUID.fromString(rs.getString("statute_section_id")))
                        .tenantId(rs.getString("statute_section_tenantid"))
                        .sections(stringToList(rs.getString("statute_section_sections")))
                        .subsections(stringToList(rs.getString("statute_section_subsections")))
                        .statute(rs.getString("statute_section_statutes"))
                        .build();

                //todo:write logic to add statue and section to case summary
            }

            String partyId = rs.getString("litigant_id");
            if (partyId != null) {
                PartySummary party = PartySummary.builder()
                        .partyCategory(rs.getString("litigant_partycategory")) // from `ltg.partycategory` or `rpst.partycategory`
                        .partyType(rs.getString("litigant_partytype")) // from `ltg.partytype` or `rpst.partytype`
                        .individualId(rs.getString("litigant_individualid")) // from `ltg.individualid` or `rpst.individualid`
//         not implemented             .individualName(rs.getString("individualName")) // Assuming you are getting this from somewhere else, as it's not in the query
                        .organisationId(rs.getString("litigant_organisationid")) // from `ltg.organisationid` or `rpst.organisationid`
//         proposed but not implemented               .isPartyInPerson(rs.getBoolean("isPartyInPerson")) // Assuming this is handled separately, as it's not in the query
                        .build();
                caseSummary.getLitigants().add(party);
            }

            String representativeId = rs.getString("representative_id");
            if (representativeId != null) {
                RepresentativeSummary representative = RepresentativeSummary.builder()
                        .partyId(rs.getString("representative_case_id")) // from `rep.case_id` (assuming this refers to the party/case represented)
                        .advocateType(rs.getString("advocateType")) // Not in the query; ensure it's populated separately if needed
                        .advocateId(rs.getString("representative_advocateid")) // from `rep.advocateid`
                        .build();

                caseSummary.getRepresentatives().add(representative);
            }
        }


        return new ArrayList<>(caseMap.values());
    }

    private Judge getJudge(ResultSet rs) {
        return Judge.builder().build();
    }

    public List<String> stringToList(String str) {
        List<String> list = new ArrayList<>();
        if (str != null) {
            StringTokenizer st = new StringTokenizer(str, ",");
            while (st.hasMoreTokens()) {
                list.add(st.nextToken());
            }
        }

        return list;
    }
}
