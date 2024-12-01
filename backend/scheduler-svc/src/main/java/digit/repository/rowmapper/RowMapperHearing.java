package digit.repository.rowmapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.web.models.HearingCauseList;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;

@Component
@Slf4j
public class RowMapperHearing implements RowMapper<HearingCauseList> {

    private final ObjectMapper objectMapper;

    public RowMapperHearing(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public HearingCauseList mapRow(ResultSet rs, int rowNum) throws SQLException {

        HearingCauseList hearingCauseList = HearingCauseList.builder()
                .hearingType(rs.getString("hearingtype"))
                .caseNumber(rs.getString("casenumber"))
                .caseTitle(rs.getString("casetitle"))
                .courtId(rs.getString("courtid"))
                .caseId(rs.getString("caseid"))
                .hearingDate(rs.getLong("starttime"))
                .applicationNumber(rs.getString("applicationnumber"))
                .build();

//        Object additionalDetails = rs.getObject("additionaldetails");
//        if (additionalDetails != null) {
//            try {
//                hearingCauseList.setAdditionalDetails(objectMapper.readValue(additionalDetails.toString(), new TypeReference<Object>() {
//                }));
//            } catch (IOException e) {
//                log.error("Error while parsing additional details", e);
//                throw new CustomException("PARSING_ERROR", "Error while parsing additional details");
//            }
//        }
        return hearingCauseList;
    }
}
