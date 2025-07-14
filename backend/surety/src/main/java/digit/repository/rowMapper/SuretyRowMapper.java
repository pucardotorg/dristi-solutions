package digit.repository.rowMapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.TypeFactory;
import digit.web.models.Surety;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

import static digit.config.ServiceConstants.ROW_MAPPER_EXCEPTION;

@Component
@Slf4j
public class SuretyRowMapper implements ResultSetExtractor<List<Surety>> {
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Surety> extractData(ResultSet rs) throws SQLException {
        Map<String, Surety> suretyMap = new LinkedHashMap<>();

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            while (rs.next()) {
                String uuid = rs.getString("id");
                Surety surety = suretyMap.get(uuid);

                if (surety == null) {
                    Long lastModifiedTime = rs.getLong("lastmodifiedtime");
                    if (rs.wasNull()) {
                        lastModifiedTime = null;
                    }

                    AuditDetails auditdetails = AuditDetails.builder()
                            .createdBy(rs.getString("createdby"))
                            .createdTime(rs.getLong("createdtime"))
                            .lastModifiedBy(rs.getString("lastmodifiedby"))
                            .lastModifiedTime(lastModifiedTime)
                            .build();

                    surety = Surety.builder()
                            .id(rs.getString("id"))
                            .name(rs.getString("name"))
                            .fatherName(rs.getString("fathername"))
                            .caseId(rs.getString("caseid"))
                            .bailId(rs.getString("bailid"))
                            .email(rs.getString("email"))
                            .mobileNumber(rs.getString("mobilenumber"))
                            .tenantId(rs.getString("tenantid"))
                            .isActive(rs.getBoolean("isactive"))
                            .hasSigned(rs.getBoolean("hassigned"))
                            .auditDetails(auditdetails)
                            .build();
                }
                PGobject pgObject1 = (PGobject) rs.getObject("additionalDetails");

                PGobject pgObject2 = (PGobject) rs.getObject("address");

                if(pgObject1!=null) {
                    surety.setAdditionalDetails(objectMapper.readTree(pgObject1.getValue()));
                }

                if(pgObject2!=null) {
                    surety.setAddress(objectMapper.readTree(pgObject2.getValue()));
                }
                suretyMap.put(uuid, surety);
            }
        }
        catch (Exception e){
            log.error("Error occurred while processing Application ResultSet: {}", e.getMessage());
            throw new CustomException(ROW_MAPPER_EXCEPTION,"Error occurred while processing Application ResultSet: "+ e.getMessage());
        }
        return new ArrayList<>(suretyMap.values());
    }

    public <T> T getObjectFromJson(String json, TypeReference<T> typeRef) {
        log.info("Converting JSON to type: {}", typeRef.getType());
        log.info("JSON content: {}", json);

        try {
            if (json == null || json.trim().isEmpty()) {
                if (isListType(typeRef)) {
                    return (T) new ArrayList<>(); // Return an empty list for list types
                } else {
                    return objectMapper.readValue("{}", typeRef); // Return an empty object for other types
                }
            }

            // Attempt to parse the JSON
            return objectMapper.readValue(json, typeRef);
        } catch (IOException e) {
            log.error("Failed to convert JSON to {}", typeRef.getType(), e);
            throw new CustomException("Failed to convert JSON to " + typeRef.getType(), e.getMessage());
        }
    }

    private <T> boolean isListType(TypeReference<T> typeRef) {
        Class<?> rawClass = TypeFactory.defaultInstance().constructType(typeRef.getType()).getRawClass();
        return List.class.isAssignableFrom(rawClass);
    }
}
