package digit.repository.rowmapper;

import digit.web.models.CaseDiaryDocumentItem;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static digit.config.ServiceConstants.ROW_MAPPER_EXCEPTION;

@Component
@Slf4j
public class DiaryWithDocumentRowMapper implements ResultSetExtractor<List<CaseDiaryDocumentItem>> {

    @Override
    public List<CaseDiaryDocumentItem> extractData(ResultSet rs) {

        List<CaseDiaryDocumentItem> caseDiaryListItems = new ArrayList<>();

        try {

            while (rs.next()) {
                CaseDiaryDocumentItem caseDiaryDocumentItem = CaseDiaryDocumentItem.builder()
                        .diaryId(UUID.fromString(rs.getString("id")))
                        .tenantId(rs.getString("tenantId"))
                        .date(rs.getLong("diaryDate"))
                        .diaryType(rs.getString("diaryType"))
                        .fileStoreID(rs.getString("fileStoreID"))
                        .documentId(rs.getString("documentId"))
                        .documentAuditDetails(AuditDetails.builder()
                                .createdTime(rs.getLong("documentCreatedTime"))
                                .createdBy(rs.getString("documentCreatedBy"))
                                .lastModifiedTime(rs.getLong("documentLastModifiedTime"))
                                .lastModifiedBy(rs.getString("documentLastModifiedBy"))
                                .build())
                        .build();
                caseDiaryListItems.add(caseDiaryDocumentItem);
            }
            return caseDiaryListItems;

        } catch (Exception e) {
            log.error("Error occurred while processing document ResultSet: {}", e.getMessage());
            throw new CustomException(ROW_MAPPER_EXCEPTION, "Error occurred while processing document ResultSet: " + e.getMessage());
        }
    }
}
