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
            String caseId = rs.getString("dc.id");
            CaseSummary caseSummary = caseMap.get(caseId);
            if (caseSummary == null) {
                caseSummary = CaseSummary.builder()
                        .id(caseId)
                        .tenantId(rs.getString("tenantid")) // from `cases.tenantid`
                        .caseTitle(rs.getString("casetitle")) // from `cases.casetitle`
                        .filingDate(rs.getLong("filingdate")) // from `cases.filingdate`
                        .statutesAndSections(null) // Assuming it's handled separately
                        .stage(rs.getString("stage")) // from `cases.stage`
                        .subStage(rs.getString("substage")) // from `cases.substage`
                        .outcome(rs.getString("outcome")) // `outcome` is not present in the query. Ensure it exists or remove it.
                        .litigants(new ArrayList<>())
                        .representatives(new ArrayList<>())
                        .judge(getJudge(rs))
                        .build();

                caseMap.put(caseId, caseSummary);
            }

            String statuteId = rs.getString("dcss.id");
            if (statuteId != null) {  // Make sure there are statutes for this case
                StatuteSection statuteSection = StatuteSection.builder()
                        .id(UUID.fromString(rs.getString("statute_section_id"))) // from `stse.id`
                        .tenantId(rs.getString("statute_section_tenantid")) // from `stse.tenantid`
                        .sections(stringToList(rs.getString("statute_section_sections"))) // from `stse.sections`
                        .subsections(stringToList(rs.getString("statute_section_subsections"))) // from `stse.subsections`
                        .statute(rs.getString("statute_section_statutes")) // from `stse.statutes`
                        .build();


                //todo:write logic to add statue and section to case summary
//                caseSummary.getStatutesAndSectionsList().add(statute);
            }

            String partyId = rs.getString("dcl.id");
            if (partyId != null) {
                PartySummary party = PartySummary.builder()
                        .partyCategory(rs.getString("litigant_partycategory")) // from `ltg.partycategory` or `rpst.partycategory`
                        .partyType(rs.getString("litigant_partytype")) // from `ltg.partytype` or `rpst.partytype`
                        .individualId(rs.getString("litigant_individualid")) // from `ltg.individualid` or `rpst.individualid`
                        .individualName(rs.getString("individualName")) // Assuming you are getting this from somewhere else, as it's not in the query
                        .organisationId(rs.getString("litigant_organisationid")) // from `ltg.organisationid` or `rpst.organisationid`
                        .isPartyInPerson(rs.getBoolean("isPartyInPerson")) // Assuming this is handled separately, as it's not in the query
                        .build();
                caseSummary.getLitigants().add(party);
            }

            String representativeId = rs.getString("dcr.id");
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
