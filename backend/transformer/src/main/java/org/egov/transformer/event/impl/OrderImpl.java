package org.egov.transformer.event.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.producer.Producer;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.event.EventListener;
import org.egov.transformer.models.CourtCase;
import org.egov.transformer.models.Order;
import org.egov.transformer.models.OrderAndNotification;
import org.egov.transformer.models.OrderNotificationRequest;
import org.egov.transformer.service.CaseService;
import org.json.JSONArray;
import org.json.JSONException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

import static org.egov.transformer.config.ServiceConstants.COMPOSITE;

@Component
@Slf4j
public class OrderImpl implements EventListener<Order, RequestInfo> {

    private final Producer producer;
    private final TransformerProperties properties;
    private final ObjectMapper objectMapper;
    private final CaseService caseService;

    @Autowired
    public OrderImpl(Producer producer, TransformerProperties properties, ObjectMapper objectMapper, CaseService caseService) {
        this.producer = producer;
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.caseService = caseService;
    }

    @Override
    public void process(Order event, RequestInfo requestInfo) {

        CourtCase courtCase = caseService.getCase(event.getFilingNumber(), event.getTenantId(), requestInfo);

        OrderAndNotification orderAndNotification = OrderAndNotification.builder()
                .type(COMPOSITE.equalsIgnoreCase(event.getOrderCategory()) ? event.getOrderCategory() : event.getOrderType())  // if its composite then order type is order category
                .id(event.getOrderNumber())
                .courtId(courtCase.getCourtId())  // no court id
                .parties(getParties(event))
                .status(event.getStatus())
                .date((event.getCreatedDate() == null) ? null : Long.valueOf(event.getCreatedDate()))
                .entityType("Order")
                .title(event.getOrderTitle())
                .tenantId(event.getTenantId())
                .filingNumbers(event.getFilingNumber() != null ? Collections.singletonList(event.getFilingNumber()) : new ArrayList<>())
                .caseNumbers(event.getFilingNumber() != null ? Collections.singletonList(event.getFilingNumber()) : new ArrayList<>())
                .judgeIds(new ArrayList<>())/// there is judge id in issued by but its UUID
                .documents(event.getDocuments())
                .createdTime(event.getAuditDetails().getCreatedTime())
                .caseTitle(enrichCaseTitle(courtCase))
                .caseSTNumber(courtCase.getCourtCaseNumber() != null ? courtCase.getCourtCaseNumber() : courtCase.getCmpNumber())
                .build();

        OrderNotificationRequest request = OrderNotificationRequest.builder()
                .requestInfo(requestInfo).orderAndNotification(orderAndNotification).build();

        producer.push(properties.getOrderAndNotificationTopic(), request);

    }

    private List<Map<String, Object>> getParties(Order event) {

        String orderCategory = event.getOrderCategory();

        if (COMPOSITE.equalsIgnoreCase(orderCategory)) {
            Set<String> partyNames = new HashSet<>();
            List<Map<String, Object>> partyList = new ArrayList<>();
            Object compositeItems = event.getCompositeItems();
            try {
                String jsonString = objectMapper.writeValueAsString(compositeItems);
                if (isValidJsonArray(jsonString)) {
                    JSONArray jsonArray = new JSONArray(jsonString);
                    List<List<Map<String, Object>>> allParties = JsonPath.read(jsonArray, "$[*].orderSchema.orderDetails.parties");

                    for (List<Map<String, Object>> parties : allParties) {
                        for (Map<String, Object> party : parties) {
                            String key = party.get("partyName").toString() + party.get("partyType").toString();
                            if (partyNames.contains(key)) {
                                continue;
                            }
                            partyList.add(party);
                            partyNames.add(key);

                        }
                    }

                } else {
                    log.error("compositeItems is not a valid json array");
                }
            } catch (Exception e) {
                log.error("Error occurred while serializing compositeItems", e);

            }
            return partyList;

        } else {
            Object orderDetails = event.getOrderDetails();
            try {
                String jsonString = objectMapper.writeValueAsString(orderDetails);
                List<Map<String, Object>> parties = JsonPath.read(jsonString, "$.parties");
                return parties;
            } catch (Exception e) {
                log.error("Error occurred while serializing orderDetails", e);
            }

        }
        return new ArrayList<>();

    }

    public boolean isValidJsonArray(String json) {
        try {
            new JSONArray(json);
            return true;
        } catch (JSONException e) {
            return false;
        }
    }

    private String enrichCaseTitle(CourtCase courtCase) {
        return (courtCase.getCourtCaseNumber() != null && !courtCase.getCourtCaseNumber().isEmpty())
                ? courtCase.getCaseTitle() + " , " + courtCase.getCourtCaseNumber()
                : courtCase.getCaseTitle() + " , " + courtCase.getCmpNumber();
    }
}
