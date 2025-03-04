package org.egov.transformer.event.impl;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.producer.Producer;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.event.EventListener;
import org.egov.transformer.models.Order;
import org.egov.transformer.models.OrderAndNotification;
import org.egov.transformer.models.OrderNotificationRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class OrderImpl implements EventListener<Order, RequestInfo> {

    private final Producer producer;
    private final TransformerProperties properties;

    @Autowired
    public OrderImpl(Producer producer, TransformerProperties properties) {
        this.producer = producer;
        this.properties = properties;
    }

    @Override
    public void process(Order event, RequestInfo requestInfo) {

        OrderAndNotification orderAndNotification = OrderAndNotification.builder()
                .type(event.getOrderType())
                .id(event.getOrderNumber())
                .comments(event.getComments())
                .courtId(null)  // no court id
                .parties(getParties(event))  // no parties
                .status(event.getStatus())
                .date(Long.valueOf(event.getCreatedDate()))
                .entityType("Order")  // assuming default value or from event
                .title(event.getOrderTitle())
                .tenantId(event.getTenantId())
                .filingNumbers(event.getFilingNumber() != null ? Collections.singletonList(event.getFilingNumber()) : new ArrayList<>())
                .caseNumbers(event.getCnrNumber() != null ? Collections.singletonList(event.getCnrNumber()) : new ArrayList<>())
                .judgeIds(new ArrayList<>())  /// there is judge id in issued by but its UUID
                .description(null)
                .build();

                OrderNotificationRequest request = OrderNotificationRequest.builder()
                .requestInfo(requestInfo).orderAndNotification(orderAndNotification).build();

        producer.push(properties.getOrderAndNotificationTopic(), request);

    }

    private List<Object> getParties(Order event) {
    }
}
