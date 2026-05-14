package digit.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.web.models.CaseMemberSearchRequest;
import digit.web.models.CaseMemberSearchResponse;
import digit.web.models.ProcessCaseMemberRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CaseUtil {

    private final Configuration configuration;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public CaseUtil(Configuration configuration,
                    ServiceRequestRepository serviceRequestRepository,
                    ObjectMapper objectMapper) {
        this.configuration = configuration;
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
    }

    public CaseMemberSearchResponse searchCaseMembers(CaseMemberSearchRequest request) {
        StringBuilder uri = new StringBuilder(configuration.getCaseHost())
                .append(configuration.getCaseMemberSearchEndPoint());

        Object response = serviceRequestRepository.fetchResult(uri, request);

        if (response == null) {
            log.error("No response received from case service for case member search");
            throw new CustomException("CASE_MEMBER_SEARCH_ERROR", "Unable to fetch case member information");
        }

        CaseMemberSearchResponse caseMemberSearchResponse = objectMapper.convertValue(response, CaseMemberSearchResponse.class);
        if (caseMemberSearchResponse.getPagination() == null) {
            caseMemberSearchResponse.setPagination(request.getPagination());
        }

        Integer totalCount = caseMemberSearchResponse.getTotalCount() != null
                ? caseMemberSearchResponse.getTotalCount()
                : (caseMemberSearchResponse.getCases() == null ? 0 : caseMemberSearchResponse.getCases().size());
        caseMemberSearchResponse.setTotalCount(totalCount);

        return caseMemberSearchResponse;
    }

    public void processCaseMember(ProcessCaseMemberRequest request) {
        StringBuilder uri = new StringBuilder(configuration.getCaseHost())
                .append(configuration.getProcessCaseMemberEndPoint());

        Object response = serviceRequestRepository.fetchResult(uri, request);

        if (response == null) {
            log.error("No response received from case service for process case member");
            throw new CustomException("PROCESS_CASE_MEMBER_ERROR", "Unable to process case member");
        }
    }
}
