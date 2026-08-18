package org.pucar.dristi.util;


import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.EPostConfiguration;
import org.pucar.dristi.model.ChannelReport;
import org.pucar.dristi.model.DeliveryStatus;
import org.pucar.dristi.model.EPostRequest;
import org.pucar.dristi.model.UpdateSummonsRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import static org.pucar.dristi.config.ServiceConstants.ERROR_WHILE_UPDATING_SUMMONS;
import static org.pucar.dristi.config.ServiceConstants.SUMMONS_UPDATE_ERROR;

@Component
@Slf4j
public class SummonsUtil {

    private final RestTemplate restTemplate;

    private final EPostConfiguration config;

    private final ObjectMapper objectMapper;

    @Autowired
    public SummonsUtil(RestTemplate restTemplate, EPostConfiguration config, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.config = config;
        this.objectMapper = objectMapper;
    }

    public Object updateSummonsDeliveryStatus(EPostRequest request) {
        String summonsUrl = config.getSummonsHost() + config.getSummonsUpdateEndPoint();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ChannelReport channelReport =ChannelReport.builder()
                .deliveryStatus(enrichDeliveryStatus(request.getEPostTracker().getDeliveryStatus()))
                .processNumber(request.getEPostTracker().getProcessNumber())
                .taskNumber(request.getEPostTracker().getTaskNumber())
                .remarks(request.getEPostTracker().getRemarks())
                .build();
        UpdateSummonsRequest summonsRequest = UpdateSummonsRequest.builder().requestInfo(request.getRequestInfo()).channelReport(channelReport).build();
        HttpEntity<UpdateSummonsRequest> requestEntity = new HttpEntity<>(summonsRequest, headers);
        try {
            // Send the request and get the response
            ResponseEntity<Object> responseEntity =
                    restTemplate.postForEntity(summonsUrl, requestEntity, Object.class);
            // Print the response body and status code
            log.info("Status Code: {}", responseEntity.getStatusCode());
            log.info("Response Body: {}", responseEntity.getBody());
            return objectMapper.convertValue(responseEntity.getBody(), Object.class);
        } catch (RestClientException e) {
            log.error("Error occurred when sending Process Request ", e);
            throw new CustomException(SUMMONS_UPDATE_ERROR,ERROR_WHILE_UPDATING_SUMMONS);
        }
    }

    private DeliveryStatus enrichDeliveryStatus(DeliveryStatus deliveryStatus) {
        if (deliveryStatus.equals(DeliveryStatus.DELIVERED) || deliveryStatus.equals(DeliveryStatus.DELIVERED_TO_REDIRECT_ADDRESS)) {
            return DeliveryStatus.DELIVERED;
        } else if (deliveryStatus.equals(DeliveryStatus.REFUSED) || deliveryStatus.equals(DeliveryStatus.ADDRESS_MOVED) || deliveryStatus.equals(DeliveryStatus.ADDRESS_LEFT_WITHOUT_INSTRUCTION)
                || deliveryStatus.equals(DeliveryStatus.INSUFFICIENT_ADDRESS) || deliveryStatus.equals(DeliveryStatus.WRONG_ADDRESS) || deliveryStatus.equals(DeliveryStatus.NO_SUCH_PERSON_IN_ADDRESS)
                || deliveryStatus.equals(DeliveryStatus.DECEASED) || deliveryStatus.equals(DeliveryStatus.ADDRESS_MISSING) || deliveryStatus.equals(DeliveryStatus.UNCLAIMED) || deliveryStatus.equals(DeliveryStatus.MISSENT)
        ) {
            return DeliveryStatus.NOT_DELIVERED;
        } else {
            return DeliveryStatus.INTERMEDIATE;
        }
    }
}
