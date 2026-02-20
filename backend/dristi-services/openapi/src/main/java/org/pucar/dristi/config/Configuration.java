package org.pucar.dristi.config;

import lombok.*;
import org.egov.tracer.config.TracerConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Data
@Import({TracerConfiguration.class})
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class Configuration {


    // User Config
    @Value("${egov.user.host}")
    private String userHost;

    @Value("${egov.user.context.path}")
    private String userContextPath;

    @Value("${egov.user.create.path}")
    private String userCreateEndpoint;

    @Value("${egov.user.search.path}")
    private String userSearchEndpoint;

    @Value("${egov.user.update.path}")
    private String userUpdateEndpoint;


    //Idgen Config
    @Value("${egov.idgen.host}")
    private String idGenHost;

    @Value("${egov.idgen.path}")
    private String idGenPath;


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


    //HRMS
    @Value("${egov.hrms.host}")
    private String hrmsHost;

    @Value("${egov.hrms.search.endpoint}")
    private String hrmsEndPoint;


    //URLShortening
    @Value("${egov.url.shortner.host}")
    private String urlShortnerHost;

    @Value("${egov.url.shortner.endpoint}")
    private String urlShortnerEndpoint;


    //SMSNotification
    @Value("${egov.sms.notification.topic}")
    private String smsNotificationTopic;

    @Value("${is.elasticsearch.enabled}")
    private Boolean isElasticSearchEnabled;

    @Value("${case.service.host}")
    private String caseServiceHost;

    @Value("${case.service.searchbycnrnumber.endpoint}")
    private String caseServiceSearchByCnrNumberEndpoint;

    @Value("${case.service.searchbycasetype.endpoint}")
    private String caseServiceSearchByCaseTypeEndpoint;

    @Value("${case.service.searchbycasenumber.endpoint}")
    private String caseServiceSearchByCaseNumberEndpoint;

    @Value("${case.service.search.endpoint}")
    private String caseServiceSearchEndpoint;

    @Value("${case.service.add.address.endpoint}")
    private String caseServiceAddAddressEndpoint;

    @Value("${hearing.service.host}")
    private String hearingServiceHost;

    @Value("${hearing.service.search.endpoint}")
    private String hearingSearchEndpoint;

    @Value("${judge.name}")
    private String judgeName;

    // inbox config
    @Value("${egov.inbox.host}")
    private String inboxHost;

    @Value("${egov.inbox.search.endpoint}")
    private String indexSearchEndPoint;


    // Advocate Config
    @Value("${egov.advocate.host}")
    private String advocateHost;

    @Value("${egov.advocate.path}")
    private String advocatePath;

    @Value("${egov.inbox.getfield.search.endpoint}")
    private String indexGetFieldEndPoint;

    //FileStore Service
    @Value("${egov.filestore.host}")
    private String fileStoreHost;

    @Value("${egov.file.store.get.endpoint}")
    private String fileStoreGetEndPoint;

    @Value("${app.zone.id}")
    private String zoneId;

    @Value("${module.names.enabled}")
    private List<String> moduleNamesEnabled;

    // Bail and Surety service configs
    @Value("${bail.service.host}")
    private String bailServiceHost;

    @Value("${bail.service.search.endpoint}")
    private String bailServiceSearchEndpoint;

    @Value("${bail.service.update.endpoint}")
    private String bailServiceUpdateEndpoint;

    // eSign Config
    @Value("${esign.service.host}")
    private String eSignHost;

    @Value("${esign.service.endpoint}")
    private String eSignEndpoint;

    //Tenant Id
    @Value("${egov-state-level-tenant-id}")
    private String egovStateTenantId;

    // evidence service configs
    @Value("${evidence.service.host}")
    private String evidenceServiceHost;

    @Value("${evidence.service.search.endpoint}")
    private String evidenceServiceSearchEndpoint;

    @Value("${evidence.service.update.endpoint}")
    private String evidenceServiceUpdateEndpoint;

    // digitalize doc service configs
    @Value("${digitalize.service.host}")
    private String digitalizeServiceHost;

    @Value("${digitalize.service.search.endpoint}")
    private String digitalizeServiceSearchEndpoint;

    @Value("${digitalize.service.update.endpoint}")
    private String digitalizeServiceUpdateEndpoint;

    // Case Status Configuration
    @Value("${case.status.disposed.outcomes}")
    private List<String> disposedOutcomes;

    @Value("${case.status.allowed.statuses}")
    private List<String> allowedCaseStatuses;

    // Billing Service
    @Value("${egov.billing.host}")
    private String BillingHost;

    @Value("${egov.billing.fetchbill.endpoint}")
    private String billingFetchBillEndpoint;

    @Value("${egov.billing.searchbill.endpoint}")
    private String billingSearchEndpoint;

    // ETreasury Service
    @Value("${egov.etreasury.host}")
    private String etreasuryHost;

    @Value("${egov.etreasury.get.breakdown.endpoint}")
    private String etreasuryGetBreakdownEndpoint;

    @Value("${egov.etreasury.process.challan.endpoint}")
    private String etreasuryProcessChallanEndpoint;

    @Value("${egov.etreasury.get.payment.receipt.endpoint}")
    private String etreasuryGetPaymentReceiptEndpoint;

    // Task Management Service
    @Value("${egov.task.management.host}")
    private String taskManagementHost;

    @Value("${egov.task.management.create.endpoint}")
    private String taskManagementCreateEndpoint;

    @Value("${egov.task.management.update.endpoint}")
    private String taskManagementUpdateEndpoint;

    @Value("${egov.task.management.search.endpoint}")
    private String taskManagementSearchEndpoint;

    // Payment Calculator Service
    @Value("${egov.payment.calculator.host}")
    private String paymentCalculatorHost;

    @Value("${egov.payment.calculator.calculate.endpoint}")
    private String paymentCalculatorCalculateEndpoint;

    // Lock Service
    @Value("${egov.lock.host}")
    private String lockHost;

    @Value("${egov.lock.get.endpoint}")
    private String lockGetEndpoint;

    @Value("${egov.lock.release.endpoint}")
    private String lockReleaseEndpoint;

    @Value("${egov.lock.set.endpoint}")
    private String lockSetEndpoint;

    @Value("${egov.order.host}")
    private String orderHost;

    @Value("${egov.order.search.path}")
    private String orderSearchPath;

    // Case Config
    @Value("${egov.case.host}")
    private String caseHost;

    @Value("${egov.case.search.path}")
    private String caseSearchPath;

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

    //Individual Service
    @Value("${egov.individual.host}")
    private String individualHost;

    @Value("${egov.individual.search.path}")
    private String individualSearchEndpoint;

    // Analytics Config
    @Value("${dristi.analytics.host}")
    private String analyticsHost;

    @Value("${dristi.analytics.offline.payment.endpoint}")
    private String offlinePaymentEndPoint;

}
