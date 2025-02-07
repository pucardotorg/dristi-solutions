package digit.repository.rowmapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.web.models.CaseDiaryActivityListItem;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static digit.config.ServiceConstants.ROW_MAPPER_EXCEPTION;

@Component
@Slf4j
public class DiaryActivityRowMapper implements ResultSetExtractor<List<CaseDiaryActivityListItem>> {

    @Override
    public List<CaseDiaryActivityListItem> extractData(ResultSet rs) throws SQLException, DataAccessException {

        try {

            List<CaseDiaryActivityListItem> caseDiaryActivityListItems = new ArrayList<>();

            while (rs.next()) {
                CaseDiaryActivityListItem caseDiaryActivityListItem = CaseDiaryActivityListItem.builder()
                        .id(UUID.fromString(rs.getString("id")))
                        .tenantId(rs.getString("tenantId"))
                        .date(rs.getLong("entryDate"))
                        .build();

                caseDiaryActivityListItems.add(caseDiaryActivityListItem);

            }

            return caseDiaryActivityListItems;
        }catch (Exception e) {
            log.error("Error occurred while processing document ResultSet: {}", e.getMessage());
            throw new CustomException(ROW_MAPPER_EXCEPTION, "Error occurred while processing document ResultSet: " + e.getMessage());
        }

    }
}
