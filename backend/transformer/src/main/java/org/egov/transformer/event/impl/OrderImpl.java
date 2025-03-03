package org.egov.transformer.event.impl;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.producer.Producer;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.event.EventListener;
import org.egov.transformer.models.Order;
import org.egov.transformer.models.OrderAndNotification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

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
                .parties(new ArrayList<>())  // no parties
                .status(event.getStatus())
                .date(Long.valueOf(event.getCreatedDate()))
                .description(null)  // no description
                .filingNumber(null) // no filing number
                .judgeIds(null) // no judges
                .tenantId(event.getTenantId())
                .build();

        producer.push(properties.getOrderAndNotificationTopic(), event);

    }
}
