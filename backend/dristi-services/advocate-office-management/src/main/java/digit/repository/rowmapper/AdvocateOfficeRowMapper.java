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
                            .tenantId(rs.getString("tenant_id"))
                            .officeAdvocateUserUuid(getUuidFromString(rs.getString("office_advocate_user_uuid")))
                            .officeAdvocateId(getUuidFromString(rs.getString("office_advocate_id")))
                            .officeAdvocateName(rs.getString("office_advocate_name"))
                            .memberType(getMemberType(rs))
                            .memberUserUuid(getUuidFromString(rs.getString("member_user_uuid")))
                            .memberId(getUuidFromString(rs.getString("member_id")))
                            .memberName(rs.getString("member_name"))
                            .memberMobileNumber(rs.getString("member_mobile_number"))
                            .memberEmail(rs.getString("member_email"))
                            .accessType(getAccessType(rs))
                            .allowCaseCreate(rs.getBoolean("allow_case_create"))
                            .addNewCasesAutomatically(rs.getBoolean("add_new_cases_automatically"))
                            .isActive(rs.getBoolean("is_active"))
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

    private UUID getUuidFromString(String uuidStr) {
        return uuidStr == null ? null : UUID.fromString(uuidStr);
    }
}
