package digit.repository.rowmapper;

import digit.web.models.CauseList;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
@Slf4j
public class CauseListRowMapper implements RowMapper<CauseList> {

    @Override
    public CauseList mapRow(ResultSet resultSet, int rowNum) throws SQLException {
        String advocateNameString = resultSet.getString("advocate_names");
        List<String> advocateNames = new ArrayList<>();

        if (advocateNameString != null) {
            advocateNames = Arrays.asList(advocateNameString.split(","));
        }
        return CauseList.builder()
                .courtId(resultSet.getString("court_id"))
                .tenantId(resultSet.getString("tenant_id"))
                .judgeId(resultSet.getString("judge_id"))
                .slot(resultSet.getString("slot"))
                .caseTitle(resultSet.getString("case_title"))
                .caseRegistrationDate(resultSet.getString("case_registration_date"))
                .advocateNames(advocateNames)
                .build();
    }
}
