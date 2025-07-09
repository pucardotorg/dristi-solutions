package digit.repository.rowmapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.web.models.Document;
import digit.web.models.Surety;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
public class SuretyRowMapper implements RowMapper<Surety> {
    private final ObjectMapper objectMapper;

    @Autowired
    public SuretyRowMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public Surety mapRow(ResultSet rs, int rowNum) throws SQLException {
        // Parse address as a generic map (or a specific Address class if you have one)
        Object address = parseJson(rs.getString("address"), new TypeReference<Object>() {});

        // Parse documents as a list
        List<Document> documents = parseJson(rs.getString("documents"), new TypeReference<List<Document>>() {});

        // Parse additionalDetails as a generic map/object
        Object additionalDetails = parseJson(rs.getString("additionaldetails"), new TypeReference<Object>() {});

        Surety surety = new Surety();
        surety.setId(rs.getString("id"));
        surety.setTenantId(rs.getString("tenantid"));
        surety.setName(rs.getString("name"));
        surety.setFatherName(rs.getString("fathername"));
        surety.setMobileNumber(rs.getString("mobilenumber"));
        surety.setEmail(rs.getString("email"));
        surety.setAddress(address);
        surety.setHasSigned(rs.getObject("hassigned") != null ? rs.getBoolean("hassigned") : null);
        surety.setIsActive(rs.getObject("isactive") != null ? rs.getBoolean("isactive") : null);
        surety.setDocuments(documents);
        surety.setAdditionalDetails(additionalDetails);
        surety.setBailId(rs.getString("bailid"));

        return surety;
    }

    private <T> T parseJson(String json, TypeReference<T> typeRef) {
        if (json == null || json.trim().isEmpty()) {
            try {
                // Return empty list/map/object as appropriate
                if (typeRef.getType().equals(new TypeReference<List<Document>>() {}.getType()) ||
                        typeRef.getType().equals(new TypeReference<List<String>>() {}.getType())) {
                    return objectMapper.readValue("[]", typeRef);
                }
                return objectMapper.readValue("{}", typeRef);
            } catch (Exception e) {
                return null;
            }
        }
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (Exception e) {
            return null;
        }
    }
}
