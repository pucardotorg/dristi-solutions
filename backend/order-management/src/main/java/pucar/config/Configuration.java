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
    @Value("${pucar.filestore.host}")
    private String fileStoreHost;

    @Value("${pucar.file.store.save.endpoint}")
    private String fileStoreSaveEndPoint;

    @Value("${pucar.filestore.path}")
    private String fileStorePath;

    @Value("${pucar.filestore.search.endpoint}")
    private String fileStoreSearchEndpoint;

    @Value("${pucar.filestore.delete.endpoint}")
    private String fileStoreDeleteEndPoint;

    // Order Config
    @Value("${pucar.order.host}")
    private String orderHost;

    @Value("${pucar.order.exists.path}")
    private String orderExistsPath;

    @Value("${pucar.order.update.path}")
    private String orderUpdatePath;

    @Value("${pucar.order.search.path}")
    private String orderSearchPath;

    // ESign Config
    @Value("${pucar.esign.host}")
    private String esignHost;

    @Value("${pucar.esign.location.endpoint}")
    private String esignLocationEndPoint;


    //SMSNotification
    @Value("${pucar.sms.notification.topic}")
    private String smsNotificationTopic;

    // zone id
    @Value("${app.zone.id}")
    private String zoneId;


    // Advocate Config
    @Value("${egov.advocate.host}")
    private String advocateHost;

    @Value("${egov.advocate.path}")
    private String advocatePath;


    @Value("${egov.task.service.host}")
    private String taskServiceHost;

    @Value("${egov.task.service.create.endpoint}")
    private String taskServiceCreateEndpoint;

    // Application Config
    @Value("${egov.application.host}")
    private String applicationHost;

    @Value("${egov.application.path}")
    private String applicationExistsPath;

    @Value("${egov.application.search.endpoint}")
    private String applicationSearchEndPoint;

    @Value("${egov.application.update.endpoint}")
    private String applicationUpdateEndPoint;


    // Case Config
    @Value("${egov.case.host}")
    private String caseHost;

    @Value("${egov.case.path}")
    private String caseExistsPath;

    @Value("${egov.case.search.path}")
    private String caseSearchPath;


    //Hearing config
    @Value("${dristhi.hearing.host}")
    private String HearingHost;

    @Value("${drishti.hearingupdate.endpoint}")
    private String HearingUpdateEndPoint;

    @Value("${drishti.hearingupdate.endpoint}")
    private String HearingCreateEndPoint;

    @Value("${drishti.hearing.search.endpoint}")
    private String hearingSearchEndPoint;

    // ADiary config

    @Value("${dristhi.adiary.host}")
    private String aDiaryHost;

    @Value("${drishti.adiary.create.bulk}")
    private String aDiaryCreateBulkEndPoint;

    @Value("${dristhi.adiary.host}")
    private String  inboxHost;

    @Value("${drishti.adiary.create.bulk}")
    private String fieldsEndPoint;

    @Value("${dristhi.adiary.host}")
    private String analyticsHost;

    @Value("${drishti.adiary.create.bulk}")
    private String createPendingTaskEndPoint;


    @Value("${dristhi.adiary.host}")
    private String schedulerHost;

    @Value("${drishti.adiary.create.bulk}")
    private String rescheduleEndPoint;


}
