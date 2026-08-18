package digit.config;

import lombok.*;
import org.egov.tracer.config.TracerConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

@Component
@Data
@Import({TracerConfiguration.class})
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class Configuration {

    //kafka

    @Value("${kafka.save.task-management.topic}")
    private String saveTaskManagementTopic;

    @Value("${kafka.update.task-management.topic}")
    private String updateTaskManagementTopic;

    // Order Config
    @Value("${dristi.order.host}")
    private String orderHost;

    @Value("${court.id}")
    private String courtId;

    @Value("${dristi.order.search.endpoint}")
    private String orderSearchEndPoint;

    // User Config
    @Value("${egov.user.host}")
    private String userHost;

    @Value("${egov.user.context.path}")
    private String userContextPath;

    @Value("${egov.user.search.path}")
    private String userSearchEndpoint;

    @Value("${egov.user.create.path}")
    private String userCreateEndpoint;

    // Task Config
    @Value("${dristi.task.host}")
    private String taskServiceHost;

    @Value("${dristi.task.create.endpoint}")
    private String taskServiceCreateEndpoint;

    @Value("${dristi.task.search.endpoint}")
    private String taskSearchEndpoint;

    @Value("${dristi.task.update.endpoint}")
    private String taskUpdateEndPoint;

    // Case Config
    @Value("${dristi.case.host}")
    private String caseHost;

    @Value("${dristi.case.search.endpoint}")
    private String caseSearchEndPoint;

    @Value("${egov.user.update.path}")
    private String userUpdateEndpoint;


    //Idgen Config
    @Value("${egov.idgen.host}")
    private String idGenHost;

    @Value("${egov.idgen.path}")
    private String idGenPath;

    // zone id
    @Value("${app.zone.id}")
    private String zoneId;

    //Workflow Config
    @Value("${egov.workflow.host}")
    private String wfHost;

    @Value("${egov.workflow.transition.path}")
    private String wfTransitionPath;

    @Value("${egov.workflow.businessservice.search.path}")
    private String wfBusinessServiceSearchPath;

    @Value("${egov.workflow.processinstance.search.path}")
    private String wfProcessInstanceSearchPath;


    //MDMS
    @Value("${egov.mdms.host}")
    private String mdmsHost;

    @Value("${egov.mdms.search.endpoint}")
    private String mdmsEndPoint;


    //URLShortening
    @Value("${egov.url.shortner.host}")
    private String urlShortnerHost;

    @Value("${egov.url.shortner.endpoint}")
    private String urlShortnerEndpoint;


    //SMSNotification
    @Value("${egov.sms.notification.topic}")
    private String smsNotificationTopic;

    // Workflow/Business Service name
    @Value("${egov.workflow.task.business.service.name}")
    private String taskBusinessServiceName;

    @Value("${egov.workflow.task.business.name}")
    private String taskBusinessName;

    // Task Management Number Config
    @Value("${egov.id.gen.task.management.name}")
    private String taskManagementIdName;

    @Value("${egov.id.gen.task.management.format}")
    private String taskManagementIdFormat;

    // Billing Config
    @Value("${egov.billing.service.host}")
    private String billingServiceHost;

    @Value("${egov.billing.service.demand.search.endpoint}")
    private String searchDemandEndpoint;

    @Value("${egov.billing.service.demand.update.endpoint}")
    private String updateDemandEndpoint;

    // Payment Calculator Service
    @Value("${payment.calculator.host}")
    private String paymentCalculatorHost;

    @Value("${payment.calculator.calculate.endpoint}")
    private String paymentCalculatorCalculateEndpoint;

    @Value("${task.management.suffix}")
    private String taskManagementSuffix;

    // ETreasury Config
    @Value("${egov.etreasury.host}")
    private String etreasuryHost;

    @Value("${egov.etreasury.demand.create.endpoint}")
    private String etreasuryDemandCreateEndPoint;

    @Value("${etreasury.payment.receipt.endpoint}")
    private String treasuryPaymentReceiptEndPoint;

    @Value("${judge.name}")
    private String judgeName;

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

    @Value("${dristi.analytics.offline.payment.endpoint}")
    private String offlinePaymentEndPoint;

    //ElasticSearch Config
    @Value("${egov.infra.indexer.host}")
    private String esHostUrl;

    @Value("${elastic.pending.task.endpoint}")
    private String pendingTaskIndexEndpoint;

    @Value("${elastic.pending.task.search}")
    private String pendingTaskSearchPath;

    @Value("${egov.indexer.es.username}")
    private String esUsername;

    @Value("${egov.indexer.es.password}")
    private String esPassword;

    // Advocate Config
    @Value("${dristi.advocate.host}")
    private String advocateHost;

    @Value("${dristi.advocate.search.endpoint}")
    private String advocateSearchEndPoint;

    // Sla values
    @Value("${sla.envelope.sla.value}")
    private Long envelopeSlaValue;

    // SMS Template IDs
    @Value("${egov.sms.notification.rpad.submission.template.id}")
    private String smsNotificationRpadSubmissionTemplateId;

    // Localization config
    @Value("${egov.localization.host}")
    private String localizationHost;

    @Value("${egov.localization.search.endpoint}")
    private String localizationSearchEndpoint;

    //HRMS Config
    @Value("${egov.hrms.host}")
    private String hrmsHost;

    @Value("${egov.hrms.search.endpoint}")
    private String hrmsSearchEndpoint;

}
