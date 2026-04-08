package digit.service;

import digit.config.Configuration;
import digit.enrichment.AdvocateOfficeEnrichment;
import digit.kafka.Producer;
import digit.repository.AdvocateOfficeRepository;
import digit.util.CacheUtil;
import digit.util.CaseUtil;
import digit.validator.AdvocateOfficeValidator;
import digit.web.models.*;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

import static digit.config.ServiceConstants.*;

@Service
@Slf4j
public class AdvocateOfficeService {

    private final AdvocateOfficeRepository advocateOfficeRepository;
    private final AdvocateOfficeValidator validator;
    private final AdvocateOfficeEnrichment enrichment;
    private final Producer producer;
    private final Configuration configuration;
    private final CaseUtil caseUtil;
    private final CacheUtil cacheUtil;

    @Autowired
    public AdvocateOfficeService(AdvocateOfficeRepository advocateOfficeRepository,
                                  AdvocateOfficeValidator validator,
                                  AdvocateOfficeEnrichment enrichment,
                                  Producer producer,
                                  Configuration configuration,
                                  CaseUtil caseUtil,
                                  CacheUtil cacheUtil) {
        this.advocateOfficeRepository = advocateOfficeRepository;
        this.validator = validator;
        this.enrichment = enrichment;
        this.producer = producer;
        this.configuration = configuration;
        this.caseUtil = caseUtil;
        this.cacheUtil = cacheUtil;
    }

    public AddMember addMember(AddMemberRequest request) {
        try {
            log.info("Adding member: {}", request.getAddMember());

            validator.validateAddMemberRequest(request);

            enrichment.enrichAddMemberRequest(request);

            validator.validateCanAddMember(request);

            producer.push(configuration.getAddMemberTopic(), request);

            log.info("Member added successfully with id: {}", request.getAddMember().getId());
            return request.getAddMember();
        } catch (CustomException e) {
            log.error("Error while adding member: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while adding member", e);
            throw new CustomException(ADD_MEMBER_ERROR, ADD_MEMBER_ERROR_MESSAGE + e.getMessage());
        }
    }

    public LeaveOffice leaveOffice(LeaveOfficeRequest request) {
        try {
            log.info("Processing leave office request: {}", request.getLeaveOffice());

            validator.validateLeaveOfficeRequest(request);

            enrichment.enrichLeaveOfficeRequest(request);

            producer.push(configuration.getLeaveOfficeTopic(), request);

            log.info("Leave office processed successfully for member: {}", request.getLeaveOffice().getMemberId());
            return request.getLeaveOffice();
        } catch (CustomException e) {
            log.error("Error while processing leave office: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while processing leave office", e);
            throw new CustomException(LEAVE_OFFICE_ERROR, LEAVE_OFFICE_ERROR_MESSAGE + e.getMessage());
        }
    }

    public UpdateMemberAccess updateMemberAccess(UpdateMemberAccessRequest request) {
        try {
            log.info("Updating member access: {}", request.getUpdateMemberAccess());

            AddMember addMember = validator.validateUpdateMemberAccessRequest(request);

            enrichment.enrichUpdateMemberAccessRequest(request, addMember);

            producer.push(configuration.getUpdateMemberAccessTopic(), request);

            log.info("Member access updated successfully for member: {}", request.getUpdateMemberAccess().getMemberId());

            return request.getUpdateMemberAccess();

        } catch (CustomException e) {
            log.error("Error while updating member access: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while updating member access", e);
            throw new CustomException(UPDATE_MEMBER_ACCESS_ERROR, UPDATE_MEMBER_ACCESS_ERROR_MESSAGE + e.getMessage());
        }
    }

    public List<AddMember> searchMembers(MemberSearchRequest request) {
        try {
            log.info("Searching members with criteria: {}", request.getSearchCriteria());

            validator.validateSearchRequest(request);

            List<AddMember> members = advocateOfficeRepository.getMembers(request.getSearchCriteria(), request.getPagination());

            log.info("Found {} members", members.size());
            return members;
        } catch (CustomException e) {
            log.error("Error while searching members: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while searching members", e);
            throw new CustomException(SEARCH_MEMBER_ERROR, SEARCH_MEMBER_ERROR_MESSAGE + e.getMessage());
        }
    }

    public CaseMemberSearchResponse searchCaseMembers(CaseMemberSearchRequest request) {
        try {
            log.info("Searching case members with criteria: {}", request.getCriteria());

            CaseMemberSearchResponse caseMemberSearchResponse = caseUtil.searchCaseMembers(request);
            log.info("Found {} case members ", caseMemberSearchResponse.getTotalCount());
            return caseMemberSearchResponse;
        } catch (CustomException e) {
            log.error("Error while searching case members: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while searching case members", e);
            throw new CustomException("CASE_MEMBER_SEARCH_ERROR", "Error searching case members: " + e.getMessage());
        }
    }

    public String checkMemberStatus(CheckMemberStatusRequest request) {
        try {
            String key = request.getAdvocateUserUuid() + "-" + request.getMemberUserUuid();
            Object status = cacheUtil.findById(key);
            return status != null ? status.toString() : "NOT_FOUND";
        } catch (CustomException e) {
            log.error("Error while checking member status: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while checking member status", e);
            throw new CustomException("CHECK_MEMBER_STATUS_ERROR", "Error checking member status: " + e.getMessage());
        }
    }

    public ProcessCaseMember processCaseMember(ProcessCaseMemberRequest request) {
        try {
            log.info("Processing case member request: {}", request.getProcessCaseMember());

            validator.validateProcessCaseMemberRequest(request);

            caseUtil.processCaseMember(request);

            log.info("Case member processed successfully");
            return request.getProcessCaseMember();
        } catch (CustomException e) {
            log.error("Error while processing case member: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while processing case member", e);
            throw new CustomException("PROCESS_CASE_MEMBER_ERROR", "Error processing case member: " + e.getMessage());
        }
    }

}
