package org.egov.transformer.config;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Component
public class TransformerProperties {

    @Value("${egov.case.host}")
    private String caseSearchUrlHost;

    @Value("${egov.case.path}")
    private String caseSearchUrlEndPoint;

    @Value("${transformer.producer.save.case.topic}")
    private String saveCaseTopic;

    @Value("${transformer.producer.update.case.topic}")
    private String updateCaseTopic;

    @Value("${transformer.producer.update.order.case.topic}")
    private String updateCaseOrderTopic;

    @Value("${transformer.producer.create.task.topic}")
    private String saveTaskTopic;

    @Value("${transformer.producer.update.task.topic}")
    private String updateTaskTopic;

    @Value("${transformer.producer.update.order.application.topic}")
    private String updateApplicationOrderTopic;

    @Value("${transformer.producer.save.order.topic}")
    private String saveOrderTopic;

    @Value("${transformer.producer.update.order.topic}")
    private String updateOrderTopic;

    @Value("${transformer.producer.save.hearing.topic}")
    private String saveHearingTopic;

    @Value("${transformer.producer.update.hearing.topic}")
    private String updateHearingTopic;

    @Value("${transformer.producer.save.application.topic}")
    private String saveApplicationTopic;

    @Value("${transformer.producer.update.application.topic}")
    private String updateApplicationTopic;

    @Value("${transformer.producer.open.hearing.topic}")
    private String openHearingTopic;

    @Value("${transformer.producer.order.notification.topic}")
    private String orderAndNotificationTopic;

    //User Config
    @Value("${egov.user.host}")
    private String userHost;

    @Value("${egov.user.search.path}")
    private String userSearchEndpoint;

    //MDMS
    @Value("${egov.mdms.host}")
    private String mdmsHost;

    @Value("${egov.user.create.path}")
    private String userCreateEndpoint;

    //Tenant Id
    @Value("${egov-state-level-tenant-id}")
    private String egovStateTenantId;
    @Value("${egov.mdms.search.endpoint}")
    private String mdmsEndPoint;

    @Value("${transformer.producer.case.search.topic}")
    private String caseSearchTopic;

    //Hearing config
    @Value("${dristi.hearing.host}")
    private String hearingHost;

    @Value("${dristi.hearing.search.endpoint}")
    private String hearingSearchEndPoint;

    // Application timezone ID
    @Value("${app.zone.id}")
    private String applicationZoneId;

    // inbox config
    @Value("${egov.inbox.host}")
    private String inboxHost;

    @Value("${egov.inbox.search.endpoint}")
    private String indexSearchEndPoint;
}
