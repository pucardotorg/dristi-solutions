package com.dristi.njdg_transformer.utils;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.inbox.InboxRequest;
import com.dristi.njdg_transformer.model.inbox.InboxResponse;
import com.dristi.njdg_transformer.repository.ServiceRequestRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.ServiceCallException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;

import static com.dristi.njdg_transformer.config.ServiceConstants.EXTERNAL_SERVICE_EXCEPTION;
import static com.dristi.njdg_transformer.config.ServiceConstants.SEARCHER_SERVICE_EXCEPTION;

@Component
@Slf4j
@RequiredArgsConstructor
public class InboxUtil {

    private final ObjectMapper objectMapper;
    private final ServiceRequestRepository serviceRequestRepository;
    private final TransformerProperties properties;

    public InboxResponse getOrders(InboxRequest request) {

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(properties.getInboxHost()).append(properties.getInboxSearchEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);
        InboxResponse inboxResponse = new InboxResponse();
        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            inboxResponse = objectMapper.readValue(jsonNode.toString(), InboxResponse.class);

        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }

        return inboxResponse;

    }
}
