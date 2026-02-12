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

    //Case Config
    @Value("${egov.case.host}")
    private String caseHost;

    @Value("${egov.case.search.endpoint}")
    private String caseSearchPath;


    //URLShortening
    @Value("${egov.url.shortner.host}")
    private String urlShortnerHost;

    @Value("${egov.url.shortner.endpoint}")
    private String urlShortnerEndpoint;

    @Value("${egov.url.shortener.expire.endpoint}")
    private String urlShortenerExpireEndpoint;

    // long url
    @Value("${domain.url}")
    private String domainUrl;

    @Value("${egov.base.url}")
    private String baseUrl;

    @Value("${egov.mediation.base.url}")
    private String mediationBaseUrl;

    @Value("${egov.long.url}")
    private String longUrl;


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

    // topic
    @Value("${egov.plea.digitalized.document.create.topic}")
    private String pleaDigitalizedDocumentCreateTopic;

    @Value("${egov.plea.digitalized.document.update.topic}")
    private String pleaDigitalizedDocumentUpdateTopic;

    //Localization
    @Value("${egov.localization.host}")
    private String localizationHost;

    @Value("${egov.localization.context.path}")
    private String localizationContextPath;

    @Value("${egov.localization.search.endpoint}")
    private String localizationSearchEndpoint;

    // Template IDs
    @Value("${egov.sms.notification.examination.sign.template.id}")
    private String examinationSignTemplateId;

    @Value("${egov.sms.notification.plea.sign.template.id}")
    private String pleaSignTemplateId;

    @Value("${egov.sms.notification.mediation.sign.template.id}")
    private String mediationSignTemplateId;

    // ESign Config
    @Value("${egov.esign.host}")
    private String esignHost;

    @Value("${egov.esign.location.endpoint}")
    private String esignLocationEndPoint;

    @Value("${dristi.esign.signature.width:250}")
    private int esignSignatureWidth;

    @Value("${dristi.esign.signature.height:50}")
    private int esignSignatureHeight;

}
