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

    @Value("${egov.idgen.digitalized.document.config}")
    private String digitalizedDocumentIdGenConfig;

    @Value("${egov.idgen.digitalized.document.format}")
    private String digitalizedDocumentIdGenFormat;


    //Workflow Config
    @Value("${egov.workflow.host}")
    private String wfHost;

    @Value("${egov.workflow.transition.path}")
    private String wfTransitionPath;

    @Value("${egov.workflow.businessservice.search.path}")
    private String wfBusinessServiceSearchPath;

    @Value("${egov.workflow.processinstance.search.path}")
    private String wfProcessInstanceSearchPath;

    @Value("${egov.workflow.digitalized.document.module.name}")
    private String digitalizedDocumentModuleName;

    @Value("${egov.workflow.mediation.digitalized.document.business.service}")
    private String mediationDigitalizedDocumentBusinessService;

    @Value("${egov.workflow.please.digitalized.document.business.service}")
    private String pleaDigitalizedDocumentBusinessService;

    @Value("${egov.workflow.examination.of.accused.digitalized.document.business.service}")
    private String examinationOfAccusedDigitalizedDocumentBusinessService;


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

    @Value("${examination.of.accused.kakfa.create.topic}")
    private String examinationOfAccusedCreateTopic;

    @Value("${examination.of.accused.kafka.update.topic}")
    private String examinationOfAccusedUpdateTopic;

    @Value("${file.max.size}")
    private long maxFileSize;

    @Value("${allowed.content.types}")
    private String[] allowedContentTypes;

    //FileStore Service
    @Value("${egov.filestore.host}")
    private String fileStoreHost;

    @Value("${egov.file.store.delete.endpoint}")
    private String fileStoreDeleteEndPoint;

    @Value("${egov.filestore.search.endpoint}")
    private String fileStoreSearchEndpoint;

    @Value("${egov.filestore.save.endpoint}")
    private String fileStoreSaveEndPoint;

    // topic
    @Value("${egov.mediation.digitalized.document.create.topic}")
    private String mediationDigitalizedDocumentCreateTopic;

    @Value("${egov.mediation.digitalized.document.update.topic}")
    private String mediationDigitalizedDocumentUpdateTopic;

}
