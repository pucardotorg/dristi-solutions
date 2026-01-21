package digit.service;

import digit.config.Configuration;
import digit.enrichment.AdvocateOfficeEnrichment;
import digit.kafka.Producer;
import digit.repository.AdvocateOfficeRepository;
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

    @Autowired
    public AdvocateOfficeService(AdvocateOfficeRepository advocateOfficeRepository,
                                  AdvocateOfficeValidator validator,
                                  AdvocateOfficeEnrichment enrichment,
                                  Producer producer,
                                  Configuration configuration) {
        this.advocateOfficeRepository = advocateOfficeRepository;
        this.validator = validator;
        this.enrichment = enrichment;
        this.producer = producer;
        this.configuration = configuration;
    }

    public AddMember addMember(AddMemberRequest request) {
        try {
            log.info("Adding member: {}", request.getAddMember());

            validator.validateAddMemberRequest(request);

            enrichment.enrichAddMemberRequest(request);

            //todo encrypt mobile number

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
}
