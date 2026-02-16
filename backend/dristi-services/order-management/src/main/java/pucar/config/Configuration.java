package pucar.config;

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

    @Value("${dristi.esign.signature.width:250}")
    private int esignSignatureWidth;

    @Value("${dristi.esign.signature.height:50}")
    private int esignSignatureHeight;


    // Advocate Config
    @Value("${dristi.advocate.host}")
    private String advocateHost;

    @Value("${dristi.advocate.search.endpoint}")
    private String advocateSearchEndPoint;


    // Task Config
    @Value("${dristi.task-management.host}")
    private String taskManagementServiceHost;

    @Value("${dristi.task-management.create.endpoint}")
    private String taskManagementServiceCreateEndpoint;

    @Value("${dristi.task-management.search.endpoint}")
    private String taskManagementSearchEndpoint;

    @Value("${dristi.task-management.update.endpoint}")
    private String taskManagementUpdateEndPoint;

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

    @Value("${dristi.case.add.witness.endpoint}")
    private String addWitnessEndPoint;

    @Value("${dristi.case.update.lpr.details.endpoint}")
    private String updateLprDetailsEndPoint;

    //Hearing config
    @Value("${dristi.hearing.host}")
    private String HearingHost;

    @Value("${dristi.hearing.update.endpoint}")
    private String HearingUpdateEndPoint;

        @Value("${dristi.hearing.summary.update.endpoint}")
    private String updateHearingSummaryEndPoint;

    @Value("${dristi.hearing.create.endpoint}")
    private String HearingCreateEndPoint;

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

    @Value("${file.max.size}")
    private long maxFileSize;

    @Value("${allowed.content.types}")
    private String[] allowedContentTypes;

    //Localization
    @Value("${egov.localization.host}")
    private String localizationHost;

    @Value("${egov.localization.context.path}")
    private String localizationContextPath;

    @Value("${egov.localization.search.endpoint}")
    private String localizationSearchEndpoint;

    // User Config
    @Value("${egov.user.host}")
    private String userHost;

    @Value("${egov.user.search.path}")
    private String userSearchEndpoint;

    @Value("${egov.sms.notification.process.fee.payment.template.id}")
    private String smsNotificationProcessFeePaymentTemplateId;

    @Value("${egov.sms.notification.rpad.submission.template.id}")
    private String smsNotificationRpadSubmissionTemplateId;

    @Value("${egov.sms.notification.process.fee.payment.pending.template.id}")
    private String smsNotificationProcessFeePaymentPendingTemplateId;

    @Value("${egov.sms.notification.rpad.submission.pending.template.id}")
    private String smsNotificationRpadSubmissionPendingTemplateId;

    @Value("${egov.sms.notification.payment.link.template.id}")
    private String smsNotificationPaymentLinkTemplateId;

    // Tenant Id
    @Value("${egov.statelevel.tenantId}")
    private  String stateLevelTenantId;


    @Value("${task.upfront.create.topic}")
    private String taskUpFrontCreateTopic;

    // URLShortening
    @Value("${egov.url.shortner.host}")
    private String urlShortnerHost;

    @Value("${egov.url.shortner.endpoint}")
    private String urlShortnerEndpoint;

    // long url
    @Value("${domain.url}")
    private String domainUrl;

    @Value("${egov.base.url}")
    private String baseUrl;

    @Value("${task.management.action.category}")
    private String taskManagementActionCategory;

    @Value("${task.management.assigned.role}")
    private List<String> taskManagementAssignedRole;

    //Elastic search
    @Value("${egov.indexer.es.username}")
    private String esUsername;

    @Value("${egov.indexer.es.password}")
    private String esPassword;

    @Value("${egov.bulk.index}")
    private String index;

    @Value("${egov.infra.indexer.host}")
    private String esHostUrl;

    @Value("${egov.bulk.index.path}")
    private String bulkPath;

    @Value("${dristi.nature.of.complainant}")
    private String natureOfComplainant;

    //Digitalized Documents
    @Value("${dristi.digitalized-documents.host}")
    private String digitalizedDocumentsHost;

    @Value("${dristi.digitalized-documents.create.endpoint}")
    private String digitalizedDocumentsCreateEndPoint;

    @Value("${dristi.digitalized-documents.search.endpoint}")
    private String digitalizedDocumentsSearchEndPoint;

    @Value("${dristi.digitalized-documents.update.endpoint}")
    private String digitalizedDocumentsUpdateEndPoint;

    //PDF Service Config
    @Value("${egov.pdf.service.host}")
    private String pdfServiceHost;

    @Value("${egov.pdf.service.create.endpoint}")
    private String pdfServiceEndpoint;

    @Value("${egov.pdf.digitisation.mediation.template.key}")
    private String pdfDigitisationMediationTemplateKey;

    @Value("${dristi.court.name}")
    private String courtName;

    @Value("${dristi.place}")
    private String place;

    @Value("${dristi.state}")
    private String state;

    @Value("${egov.mdms.host}")
    private String mdmsHost;

    @Value("${egov.mdms.v2.search.endpoint}")
    private String mdmsV2EndPoint;
}
