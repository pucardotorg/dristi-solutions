package digit.kafka.cosumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.service.hearing.HearingProcessor;
import digit.util.HearingUtil;
import digit.web.models.hearing.HearingRequest;
import digit.web.models.hearing.RetryHearingRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.HashMap;

@Component
@Slf4j
public class HearingConsumer {

    private final ObjectMapper mapper;
    private final HearingProcessor processor;
    private final HearingUtil hearingUtil;
    private final Configuration configuration;

    @Autowired
    public HearingConsumer(ObjectMapper mapper, HearingProcessor processor, HearingUtil hearingUtil, Configuration configuration) {
        this.mapper = mapper;
        this.processor = processor;
        this.hearingUtil = hearingUtil;
        this.configuration = configuration;
    }

    @KafkaListener(topics = {"create-hearing-application"})
    public void listenScheduleHearing(final HashMap<String, Object> record, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {

        log.info("Received create hearing message in topic {}", topic);
        try {
            HearingRequest hearingRequest = mapper.convertValue(record, HearingRequest.class);
            processor.processCreateHearingRequest(hearingRequest, Boolean.TRUE);
        } catch (Exception e) {
            log.error("error occurred while serializing", e);
        }

    }


    @KafkaListener(topics = {"egov-hearing-update-time-retry"}, groupId = "hearing-update-time-retry")
    public void retryCallHearing(final HashMap<String, Object> record, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        log.info("Received create hearing update time message in topic {}", topic);
        try {
            RetryHearingRequest retryRequest = mapper.convertValue(record, RetryHearingRequest.class);
            long delay = configuration.getHearingRetryDelayMs() != null ? configuration.getHearingRetryDelayMs() : 60000L;

            if (retryRequest.getHearingRequest() == null ||
                    retryRequest.getHearingRequest().getHearings() == null ||
                    retryRequest.getHearingRequest().getHearings().isEmpty()) {
                log.error("Invalid hearing request structure in retry request");
                return;
            }

            String hearingId = retryRequest.getHearingRequest().getHearings().get(0).getHearingId();
            log.info("Delaying retry of callHearing by {} ms for hearingId: {}", delay, hearingId);

            try {
                Thread.sleep(delay);
            } catch (InterruptedException ie) {
                log.warn("Thread interrupted while delaying retry for hearingId: {}", hearingId, ie);
                Thread.currentThread().interrupt();
            }

            try {
                hearingUtil.callHearing(retryRequest.getHearingRequest(), retryRequest.getIsRetryRequired());
            } catch (Exception ex) {
                log.error("Failed to call hearingUtil.callHearing for hearingId: {}", hearingId, ex);
            }

        } catch (Exception e) {
            log.error("Error occurred while deserializing RetryHearingRequest", e);
        }
    }



}



