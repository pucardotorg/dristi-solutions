package digit.repository.rowmapper;

import digit.web.models.AddMember;
import digit.web.models.enums.AccessType;
import digit.web.models.enums.MemberType;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

import static digit.config.ServiceConstants.ROW_MAPPER_ERROR;
import static digit.config.ServiceConstants.ROW_MAPPER_ERROR_MESSAGE;

@Component
@Slf4j
public class AdvocateOfficeRowMapper implements ResultSetExtractor<List<AddMember>> {

    @Override
    public List<AddMember> extractData(ResultSet rs) {
        Map<String, AddMember> memberMap = new LinkedHashMap<>();

        try {
            while (rs.next()) {
                String id = rs.getString("id");
                AddMember member = memberMap.get(id);

                if (member == null) {
                    AuditDetails auditDetails = AuditDetails.builder()
                            .createdBy(rs.getString("created_by"))
                            .createdTime(rs.getLong("created_time"))
                            .lastModifiedBy(rs.getString("last_modified_by"))
                            .lastModifiedTime(rs.getLong("last_modified_time"))
                            .build();

                    member = AddMember.builder()
                            .id(UUID.fromString(id))
                            .officeAdvocateId(UUID.fromString(rs.getString("office_advocate_id")))
                            .memberType(getMemberType(rs))
                            .memberId(UUID.fromString(rs.getString("member_id")))
                            .memberName(rs.getString("member_name"))
                            .memberMobileNumber(rs.getString("member_mobile_number"))
                            .accessType(getAccessType(rs))
                            .allowCaseCreate(rs.getBoolean("allow_case_create"))
                            .addNewCasesAutomatically(rs.getBoolean("add_new_cases_automatically"))
                            .auditDetails(auditDetails)
                            .build();

                    memberMap.put(id, member);
                }
            }
        } catch (Exception e) {
            log.error("Error occurred while processing AddMember ResultSet", e);
            throw new CustomException(ROW_MAPPER_ERROR, ROW_MAPPER_ERROR_MESSAGE + e.getMessage());
        }

        return new ArrayList<>(memberMap.values());
    }

    private MemberType getMemberType(ResultSet rs) throws SQLException {
        String type = rs.getString("member_type");
        return type == null ? null : MemberType.valueOf(type);
    }

    private AccessType getAccessType(ResultSet rs) throws SQLException {
        String type = rs.getString("access_type");
        return type == null ? AccessType.ALL_CASES : AccessType.valueOf(type);
    }
}
