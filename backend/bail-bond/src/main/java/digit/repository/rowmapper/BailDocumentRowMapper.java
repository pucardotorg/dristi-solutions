package digit.repository.rowmapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import digit.web.models.Document;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.util.*;

import static digit.config.ServiceConstants.ROW_MAPPER_EXCEPTION;

@Component
@Slf4j
public class BailDocumentRowMapper implements ResultSetExtractor<Map<String, List<Document>>> {

    /**
     * Maps the result set to a map of bailId to its corresponding document list.
     * @param rs result set
     * @return map of bailId (String) to list of Document
     */
    @Override
    public Map<String, List<Document>> extractData(ResultSet rs) {
        Map<String, List<Document>> documentMap = new LinkedHashMap<>();
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            while (rs.next()) {
                String bailId = rs.getString("bailid");
                Document document = Document.builder()
                        .id(rs.getString("id"))
                        .documentType(rs.getString("documenttype"))
                        .fileStore(rs.getString("filestore"))
                        .documentUid(rs.getString("documentuid"))
                        .isActive(rs.getBoolean("isactive"))
                        .build();

                PGobject pgObject = (PGobject) rs.getObject("additionaldetails");
                if (pgObject != null && pgObject.getValue() != null) {
                    document.setAdditionalDetails(objectMapper.readTree(pgObject.getValue()));
                }

                documentMap.computeIfAbsent(bailId, k -> new ArrayList<>()).add(document);
            }
        } catch (Exception e) {
            log.error("Error occurred while processing bail document ResultSet: {}", e.getMessage());
            throw new CustomException(ROW_MAPPER_EXCEPTION, "Error occurred while processing bail document ResultSet: " + e.getMessage());
        }
        return documentMap;
    }
}

