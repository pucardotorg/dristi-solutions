package digit.repository.rowmapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.web.models.Surety;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
public class SuretyRowMapper implements ResultSetExtractor<Map<UUID, Surety>> {
    public Map<UUID, Surety> extractData(ResultSet rs) {
        Map<UUID, Surety> amountMap = new LinkedHashMap<>();

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            while (rs.next()) {
                String id = rs.getString("task_id");
                UUID uuid = UUID.fromString(id);

                Surety surety = Surety.builder()
                        .id(UUID.fromString(rs.getString("id")))
                        .type(rs.getString("type"))
                        .status(rs.getString("status"))
                        .amount(rs.getString("amount"))
                        .paymentRefNumber(rs.getString("paymentrefnumber"))
                        .build();

                PGobject pgObject = (PGobject) rs.getObject("additionaldetails");
                if (pgObject != null)
                    surety.setAdditionalDetails(objectMapper.readTree(pgObject.getValue()));

                amountMap.put(uuid, surety);
            }
        } catch(CustomException e){
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while processing Task amount ResultSet :: {}", e.toString());
            throw new CustomException(ROW_MAPPER_EXCEPTION, "Error occurred while processing Task amount ResultSet: " + e.getMessage());
        }
        return amountMap;
    }

}
