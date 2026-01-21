package digit.validator;

import digit.repository.AdvocateOfficeRepository;
import digit.web.models.*;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

import static digit.config.ServiceConstants.*;

@Component
@Slf4j
public class AdvocateOfficeValidator {

    private final AdvocateOfficeRepository advocateOfficeRepository;

    @Autowired
    public AdvocateOfficeValidator(AdvocateOfficeRepository advocateOfficeRepository) {
        this.advocateOfficeRepository = advocateOfficeRepository;
    }

    public void validateAddMemberRequest(AddMemberRequest request) {
        AddMember addMember = request.getAddMember();

        // Check if member already exists in the office
        MemberSearchCriteria searchCriteria = MemberSearchCriteria.builder()
                .officeAdvocateId(addMember.getOfficeAdvocateId())
                .memberId(addMember.getMemberId())
                .build();

        List<AddMember> existingMembers = advocateOfficeRepository.getMembers(searchCriteria, null);
        if (!existingMembers.isEmpty()) {
            throw new CustomException(MEMBER_ALREADY_EXISTS, MEMBER_ALREADY_EXISTS_MESSAGE);
        }

        // todo call user services to check if uuid exists for both officeAdvocateId and memberId
    }

    public void validateLeaveOfficeRequest(LeaveOfficeRequest request) {
        LeaveOffice leaveOffice = request.getLeaveOffice();

        // Check if member exists in the office
        MemberSearchCriteria searchCriteria = MemberSearchCriteria.builder()
                .officeAdvocateId(leaveOffice.getOfficeAdvocateId())
                .memberId(leaveOffice.getMemberId())
                .build();

        List<AddMember> existingMembers = advocateOfficeRepository.getMembers(searchCriteria, null);
        if (existingMembers.isEmpty()) {
            throw new CustomException(MEMBER_NOT_FOUND, MEMBER_NOT_FOUND_MESSAGE);
        }
    }

    public void validateSearchRequest(MemberSearchRequest request) {
        if (request.getSearchCriteria() == null) {
            throw new CustomException(SEARCH_CRITERIA_NULL, SEARCH_CRITERIA_NULL_MESSAGE);
        }
    }
}
