package digit.repository.rowMapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.web.models.Document;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.util.*;

import static digit.config.ServiceConstants.DOCUMENT_ROW_MAPPER_EXCEPTION;


@Component
@Slf4j
public class DocumentRowMapper implements ResultSetExtractor<Map<String,List<Document>>> {
    public Map<String,List<Document>> extractData(ResultSet rs) {
        Map<String, List<Document>> documentMap = new LinkedHashMap<>();
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            while (rs.next()) {
                String suretyId = rs.getString("surety_id");
                Document document = Document.builder()
                        .id(rs.getString("id"))
                        .documentType(rs.getString("documenttype"))
                        .fileStore(rs.getString("filestore"))
                        .documentUid(rs.getString("documentuid"))
                        .isActive(rs.getBoolean("isactive"))
                        .build();

                PGobject pgObject = (PGobject) rs.getObject("additionaldetails");
                if(pgObject!=null)
                    document.setAdditionalDetails(objectMapper.readTree(pgObject.getValue()));

                if (documentMap.containsKey(suretyId) ) {
                    documentMap.get(suretyId).add(document);
                }
                else{
                    List<Document> documents = new ArrayList<>();
                    documents.add(document);
                    documentMap.put(suretyId,documents);
                }
            }
        }
        catch (Exception e){
            log.error("Error occurred while processing document ResultSet: {}", e.getMessage());
            throw new CustomException(DOCUMENT_ROW_MAPPER_EXCEPTION,"Error occurred while processing document ResultSet: "+ e.getMessage());
        }
        return documentMap;
    }
}