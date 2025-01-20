package digit.repository.rowmapper;

import digit.web.models.CaseDiaryEntry;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.jetbrains.annotations.NotNull;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

import static digit.config.ServiceConstants.ROW_MAPPER_EXCEPTION;

@Component
@Slf4j
public class DiaryEntryRowMapper implements ResultSetExtractor<List<CaseDiaryEntry>> {

    @Override
    public List<CaseDiaryEntry> extractData(ResultSet rs) {

        List<CaseDiaryEntry> caseDiaryEntryList = new ArrayList<>();

        try {

            while (rs.next()) {
                CaseDiaryEntry caseDiaryEntry = CaseDiaryEntry.builder()
                        .id(UUID.fromString(rs.getString("id")))
                        .tenantId(rs.getString("tenantId"))
                        .entryDate(rs.getLong("entryDate"))
                        .caseNumber(rs.getString("caseNumber"))
                        .judgeId(rs.getString("judgeId"))
                        .businessOfDay(rs.getString("businessOfDay"))
                        .referenceId(rs.getString("referenceId"))
                        .referenceType(rs.getString("referenceType"))
                        .hearingDate(rs.getLong("hearingDate"))
//                        .additionalDetails()
                        .auditDetails(AuditDetails.builder()
                                .createdTime(rs.getLong("createdTime"))
                                .createdBy(rs.getString("createdBy"))
                                .lastModifiedTime(rs.getLong("lastModifiedTime"))
                                .lastModifiedBy(rs.getString("lastModifiedBy"))
                                .build())
                        .build();
                caseDiaryEntryList.add(caseDiaryEntry);
            }

            return caseDiaryEntryList;

        } catch (Exception e) {
            log.error("Error occurred while processing document ResultSet: {}", e.getMessage());
            throw new CustomException(ROW_MAPPER_EXCEPTION, "Error occurred while processing document ResultSet: " + e.getMessage());
        }
    }

}
