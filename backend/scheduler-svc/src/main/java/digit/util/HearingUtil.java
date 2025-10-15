package digit.util;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import digit.config.Configuration;
import digit.kafka.producer.Producer;
import digit.repository.ServiceRequestRepository;
import digit.web.models.hearing.*;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.ServiceCallException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;

import java.util.List;

import static digit.config.ServiceConstants.*;

@Component
@Slf4j
public class HearingUtil {

    private final ObjectMapper objectMapper;

    private final Configuration configuration;

    private final ServiceRequestRepository serviceRequestRepository;

    private final Producer producer;

    public HearingUtil(ObjectMapper objectMapper, Configuration configuration, ServiceRequestRepository serviceRequestRepository, Producer producer) {
        this.objectMapper = objectMapper;
        this.configuration = configuration;
        this.serviceRequestRepository = serviceRequestRepository;
        this.producer = producer;
    }

    public void callHearing(HearingUpdateBulkRequest hearingRequest, Boolean isRetryRequired) {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getHearingHost().concat(configuration.getHearingUpdateEndPoint()));
        try {
            serviceRequestRepository.fetchResult(uri, hearingRequest);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
            if (Boolean.TRUE.equals(isRetryRequired)) {
                log.info("Retrying callHearing after delay for hearingId: {}", hearingRequest.getHearings().get(0).getHearingId());

                RetryHearingRequest retryPayload = new RetryHearingRequest(hearingRequest, Boolean.FALSE);
                producer.push(configuration.getRetryHearingUpdateTimeTopic(), retryPayload);
            }
        }
    }

    public List<Hearing> fetchHearing(HearingListSearchRequest request) {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS,false);
        StringBuilder uri = new StringBuilder(configuration.getHearingHost().concat(configuration.getHearingSearchEndPoint()));

        Object response = serviceRequestRepository.fetchResult(uri,request);
        List<Hearing> hearingList = null;
        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            JsonNode hearingListNode = jsonNode.get("HearingList");
            hearingList = objectMapper.readValue(hearingListNode.toString(), new TypeReference<>() {
            });
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }
        return hearingList;
    }

    public void updateHearings(HearingRequest request) {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS,false);
        StringBuilder uri = new StringBuilder(configuration.getHearingHost().concat(configuration.getHearingsUpdateEndPoint()));
        try {
            serviceRequestRepository.fetchResult(uri,request);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }
    }

    public List<Integer> getNoOfDaysToHearing() {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS,false);
        StringBuilder uri = new StringBuilder(configuration.getHearingHost().concat(configuration.getDaysToHearingEndPoint()));
        try {
            Object response = serviceRequestRepository.postMethod(uri, HearingRequest.builder().build());
            return objectMapper.readValue(response.toString(), new TypeReference<>() {
            });
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
            return null;
        }
    }
}
