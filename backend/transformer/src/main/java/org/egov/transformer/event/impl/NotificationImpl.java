package org.egov.transformer.event.impl;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.producer.Producer;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.event.EventListener;
import org.egov.transformer.models.Notification;
import org.egov.transformer.models.OrderAndNotification;
import org.egov.transformer.models.OrderNotificationRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
@Slf4j
public class NotificationImpl implements EventListener<Notification, RequestInfo> {

    private final Producer producer;
    private final TransformerProperties properties;

    @Autowired
    public NotificationImpl(Producer producer, TransformerProperties properties) {
        this.producer = producer;
        this.properties = properties;
    }

    @Override
    public void process(Notification event, RequestInfo requestInfo) {

        OrderAndNotification orderAndNotification = OrderAndNotification.builder()
                .type(event.getNotificationType())
                .id(event.getNotificationNumber())
                .courtId(null)  // no court id
                .parties(new ArrayList<>())  // no parties
                .status(event.getStatus())
                .date(event.getCreatedDate())
                .entityType("Notice")
                .title(event.getNotificationType())
                .tenantId(event.getTenantId())
                .filingNumbers( new ArrayList<>())
                .caseNumbers(event.getCaseNumber() != null ? event.getCaseNumber() : new ArrayList<>())
                .judgeIds( new ArrayList<>())
                .build();

        OrderNotificationRequest request = OrderNotificationRequest.builder()
                .requestInfo(requestInfo).orderAndNotification(orderAndNotification).build();

        producer.push(properties.getOrderAndNotificationTopic(), request);

    }
}
