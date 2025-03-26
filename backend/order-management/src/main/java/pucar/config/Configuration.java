package pucar.config;

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

    // Filestore Config
    @Value("${dristi.filestore.host}")
    private String fileStoreHost;

    @Value("${dristi.filestore.save.endpoint}")
    private String fileStoreSaveEndPoint;

    @Value("${dristi.filestore.path}")
    private String fileStorePath;

    @Value("${dristi.filestore.search.endpoint}")
    private String fileStoreSearchEndpoint;

    @Value("${dristi.filestore.delete.endpoint}")
    private String fileStoreDeleteEndPoint;

    // Order Config
    @Value("${dristi.order.host}")
    private String orderHost;

    @Value("${dristi.order.exists.path}")
    private String orderExistsPath;

    @Value("${dristi.order.update.path}")
    private String orderUpdatePath;

    @Value("${dristi.order.search.path}")
    private String orderSearchPath;

    // ESign Config
    @Value("${dristi.esign.host}")
    private String esignHost;

    @Value("${dristi.esign.location.endpoint}")
    private String esignLocationEndPoint;


    //SMSNotification
    @Value("${dristi.sms.notification.topic}")
    private String smsNotificationTopic;

    // zone id
    @Value("${app.zone.id}")
    private String zoneId;


    // Advocate Config
    @Value("${dristi.advocate.host}")
    private String advocateHost;

    @Value("${dristi.advocate.path}")
    private String advocatePath;


    @Value("${dristi.task.service.host}")
    private String taskServiceHost;

    @Value("${dristi.task.service.create.endpoint}")
    private String taskServiceCreateEndpoint;

    // Application Config
    @Value("${dristi.application.host}")
    private String applicationHost;

    @Value("${dristi.application.path}")
    private String applicationExistsPath;

    @Value("${dristi.application.search.endpoint}")
    private String applicationSearchEndPoint;

    @Value("${dristi.application.update.endpoint}")
    private String applicationUpdateEndPoint;


    // Case Config
    @Value("${dristi.case.host}")
    private String caseHost;

    @Value("${dristi.case.path}")
    private String caseExistsPath;

    @Value("${dristi.case.search.path}")
    private String caseSearchPath;


    //Hearing config
    @Value("${dristi.hearing.host}")
    private String HearingHost;

    @Value("${dristi.hearingupdate.endpoint}")
    private String HearingUpdateEndPoint;

    @Value("${dristi.hearingupdate.endpoint}")
    private String HearingCreateEndPoint;

    @Value("${dristi.hearing.search.endpoint}")
    private String hearingSearchEndPoint;

    // ADiary config

    @Value("${dristi.adiary.host}")
    private String aDiaryHost;

    @Value("${dristi.adiary.create.bulk}")
    private String aDiaryCreateBulkEndPoint;

    @Value("${dristi.inbox.host}")
    private String  inboxHost;

    @Value("${dristi.inbox.fields.endpoint}")
    private String fieldsEndPoint;

    @Value("${dristi.analytics.host}")
    private String analyticsHost;

    @Value("${dristi.analytics.create.pendingtask}")
    private String createPendingTaskEndPoint;


    @Value("${dristi.scheduler.host}")
    private String schedulerHost;

    @Value("${dristi.scheduler.reschedule.endpoint}")
    private String rescheduleEndPoint;

    @Value("${spring.redis.timeout}")
    private Long redisTimeout;

}
