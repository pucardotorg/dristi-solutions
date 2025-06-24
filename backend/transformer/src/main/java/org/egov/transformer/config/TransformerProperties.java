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


    //MDMS
    @Value("${egov.mdms.host}")
    private String mdmsHost;

    @Value("${egov.mdms.search.endpoint}")
    private String mdmsEndPoint;

    @Value("${transformer.producer.case.search.topic}")
    private String caseSearchTopic;

    // Filestore Config
    @Value("${dristi.filestore.host}")
    private String fileStoreHost;

    @Value("${dristi.filestore.save.endpoint}")
    private String fileStoreSaveEndPoint;


    @Value("${dristi.filestore.search.endpoint}")
    private String fileStoreSearchEndpoint;

    @Value("${dristi.filestore.delete.endpoint}")
    private String fileStoreDeleteEndPoint;

    // Order Config
    @Value("${dristi.order.host}")
    private String orderHost;

    @Value("${court.id}")
    private String courtId;


    @Value("${dristi.order.add.item.endpoint}")
    private String addOrderItemEndPoint;

    @Value("${dristi.order.remove.item.endpoint}")
    private String removeOrderItemEndPoint;

    @Value("${dristi.order.exists.endpoint}")
    private String orderExistsEndPoint;

    @Value("${dristi.order.update.endpoint}")
    private String orderUpdateEndPoint;

    @Value("${dristi.order.search.endpoint}")
    private String orderSearchEndPoint;

    @Value("${dristi.order.create.endpoint}")
    private String orderCreateEndPoint;

    // ESign Config
    @Value("${dristi.esign.host}")
    private String esignHost;

    @Value("${dristi.esign.location.endpoint}")
    private String esignLocationEndPoint;


    // Advocate Config
    @Value("${dristi.advocate.host}")
    private String advocateHost;

    @Value("${dristi.advocate.search.endpoint}")
    private String advocateSearchEndPoint;


    // Task Config
    @Value("${dristi.task.host}")
    private String taskServiceHost;

    @Value("${dristi.task.create.endpoint}")
    private String taskServiceCreateEndpoint;

    @Value("${dristi.task.search.endpoint}")
    private String taskSearchEndpoint;

    @Value("${dristi.task.update.endpoint}")
    private String taskUpdateEndPoint;

    // Application Config
    @Value("${dristi.application.host}")
    private String applicationHost;

    @Value("${dristi.application.exists.endpoint}")
    private String applicationExistsEndPoint;

    @Value("${dristi.application.search.endpoint}")
    private String applicationSearchEndPoint;

    @Value("${dristi.application.update.endpoint}")
    private String applicationUpdateEndPoint;


    // Case Config
    @Value("${dristi.case.host}")
    private String caseHost;

    @Value("${dristi.case.exists.endpoint}")
    private String caseExistsEndPoint;

    @Value("${dristi.case.search.endpoint}")
    private String caseSearchEndPoint;

    @Value("${dristi.case.update.endpoint}")
    private String caseUpdateEndPoint;

    @Value("${dristi.case.process.profile.endpoint}")
    private String processProfileEndPoint;


    //Hearing config
    @Value("${dristi.hearing.host}")
    private String hearingHost;

    @Value("${dristi.hearing.update.endpoint}")
    private String hearingUpdateEndPoint;

    @Value("${dristi.hearing.summary.update.endpoint}")
    private String updateHearingSummaryEndPoint;

    @Value("${dristi.hearing.create.endpoint}")
    private String hearingCreateEndPoint;

    @Value("${dristi.hearing.search.endpoint}")
    private String hearingSearchEndPoint;

    // ADiary config

    @Value("${dristi.adiary.host}")
    private String aDiaryHost;

    @Value("${dristi.adiary.create.bulk}")
    private String aDiaryCreateBulkEndPoint;

    // Inbox Config
    @Value("${dristi.inbox.host}")
    private String inboxHost;

    @Value("${dristi.inbox.index.search.endpoint}")
    private String indexSearchEndPoint;

    // Analytics Config
    @Value("${dristi.analytics.host}")
    private String analyticsHost;

    @Value("${dristi.analytics.create.pendingtask}")
    private String createPendingTaskEndPoint;

    // Scheduler Config
    @Value("${dristi.scheduler.host}")
    private String schedulerHost;

    @Value("${dristi.scheduler.reschedule.endpoint}")
    private String rescheduleEndPoint;

    // Individual Config

    @Value("${dristi.individual.host}")
    private String individualHost;

    @Value("${dristi.individual.search.endpoint}")
    private String individualSearchEndPoint;


    @Value("${spring.redis.timeout}")
    private Long redisTimeout;

    //SMSNotification
    @Value("${dristi.sms.notification.topic}")
    private String smsNotificationTopic;

    // zone id
    @Value("${app.zone.id}")
    private String zoneId;

    //HRMS
    @Value("${egov.hrms.host}")
    private String hrmsHost;

    @Value("${egov.hrms.search.endpoint}")
    private String hrmsEndPoint;
}
