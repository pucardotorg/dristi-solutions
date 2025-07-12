package digit.repository.rowmapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.web.models.Bail;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.pucar.dristi.web.models.AssignedTo;
import org.pucar.dristi.web.models.TaskCase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.sql.ResultSet;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.ROW_MAPPER_EXCEPTION;


@Slf4j
@Component
public class BailRowMapper implements ResultSetExtractor<List<Bail>> {

    private final ObjectMapper objectMapper;

    @Autowired
    public BailRowMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<Bail> extractData(ResultSet rs) {
        Map<String, Bail> taskMap = new LinkedHashMap<>();

        try {
            while (rs.next()) {
                String uuid = rs.getString("id");
                Bail bail = taskMap.get(uuid);

                if (bail == null) {
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

                    bail = Bail.builder()
                            .id(UUID.fromString(rs.getString("id")))
                            .tenantId(rs.getString("tenantid"))
                            .orderId(UUID.fromString(rs.getString("orderid")))
                            .filingNumber(rs.getString("filingnumber"))
                            .taskNumber(rs.getString("tasknumber"))
                            .cnrNumber(rs.getString("cnrnumber"))
                            .cmpNumber(rs.getString("cmpNumber"))
                            .courtCaseNumber(rs.getString("courtCaseNumber"))
                            .courtId(rs.getString("courtId"))
                            .createdDate(rs.getLong("createddate"))
                            .dateCloseBy(rs.getLong("datecloseby"))
                            .dateClosed(rs.getLong("dateclosed"))
                            .taskDescription(rs.getString("taskdescription"))
                            .taskDetails(objectMapper.readValue(rs.getString("taskdetails"), Object.class))
                            .taskType(rs.getString("tasktype"))
                            .status(rs.getString("status"))
                            .documentStatus(rs.getString("documentStatus"))
                            .isActive(Boolean.valueOf(rs.getString("isactive")))
                            .auditDetails(auditdetails)
                            .caseName(rs.getString("casename"))
                            .orderType(rs.getString("ordertype"))
                            .build();
                }

                PGobject pgObject = (PGobject) rs.getObject("additionaldetails");
                if (pgObject != null)
                    bail.setAdditionalDetails(objectMapper.readTree(pgObject.getValue()));

                taskMap.put(uuid, bail);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while processing task ResultSet :: {}", e.toString());
            throw new CustomException(ROW_MAPPER_EXCEPTION, "Error occurred while processing Task ResultSet: " + e.getMessage());
        }
        return new ArrayList<>(taskMap.values());
    }

    private LocalDate stringToLocalDate(String str) {
        LocalDate localDate = null;
        if (str != null)
            try {
                DateTimeFormatter pattern = DateTimeFormatter.ofPattern("dd-MM-yyyy");
                localDate = LocalDate.parse(str, pattern);
            } catch (DateTimeParseException e) {
                log.error("Date parsing failed for input: {}", str, e);
                throw new CustomException("DATE_PARSING_FAILED", "Failed to parse date: " + str);
            }

        return localDate;
    }

    public <T> T getObjectFromJson(String json, TypeReference<T> typeRef) {
        if (json == null || json.trim().isEmpty()) {
            try {
                return objectMapper.readValue("{}", typeRef); // Return an empty object of the specified type
            } catch (IOException e) {
                throw new CustomException("Failed to create an empty instance of " + typeRef.getType(), e.getMessage());
            }
        }
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (Exception e) {
            throw new CustomException("Failed to convert JSON to " + typeRef.getType(), e.getMessage());
        }
    }

}
