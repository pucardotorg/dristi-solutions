package digit.util;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.web.models.scheduler.JudgeCalenderSearchRequest;
import digit.web.models.scheduler.JudgeRuleResponse;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;

import static digit.config.ServiceConstants.EXTERNAL_SERVICE_EXCEPTION;
import static digit.config.ServiceConstants.SEARCHER_SERVICE_EXCEPTION;

@Component
@Slf4j
public class SchedulerUtil {

    private final Configuration configuration;
    private final ObjectMapper objectMapper;
    private final ServiceRequestRepository serviceRequestRepository;

    @Autowired
    public SchedulerUtil(Configuration configuration, ObjectMapper objectMapper, ServiceRequestRepository serviceRequestRepository) {
        this.configuration = configuration;
        this.objectMapper = objectMapper;
        this.serviceRequestRepository = serviceRequestRepository;
    }


    public JudgeRuleResponse searchJudgeCalender(JudgeCalenderSearchRequest request) {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getSchedulerHost()).append(configuration.getSchedulerPath());
        Object response = serviceRequestRepository.fetchResult(uri, request);

        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            return objectMapper.readValue(jsonNode.toString(), JudgeRuleResponse.class);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
            throw new CustomException(); // add log and code
        }
    }
}
