package digit.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;
import org.egov.encryption.config.EncProperties;
import org.egov.tracer.config.TracerConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

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

    @Value("${egov.idgen.bailConfig}")
    private String bailConfig;

    @Value("${egov.idgen.bailFormat}")
    private String bailFormat;


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

    @Value("${egov.url.shortener.expire.endpoint}")
    private String urlShortenerExpireEndpoint;



    //SMSNotification
    @Value("${egov.sms.notification.topic}")
    private String smsNotificationTopic;

    //Email
    @Value("${egov.mail.notification.topic}")
    private String mailNotificationTopic;

    //Bail
    @Value("${bail.kafka.create.topic}")
    private String bailCreateTopic;

    @Value("${bail.kafka.update.topic}")
    private String bailUpdateTopic;

    @Value("${egov.workflow.bail.business.name}")
    private String bailBusinessName;

    @Value("${egov.workflow.bail.business.service.name}")
    private String bailBusinessServiceName;

    //Case Config
    @Value("${egov.case.host}")
    private String caseHost;

    @Value("${egov.case.search.endpoint}")
    private String caseSearchPath;

    @Value("${egov.enc.mdms.security.policy.bail.encrypt}")
    private String bailEncrypt;

    @Value("${egov.enc.mdms.security.policy.bail.decrypt}")
    private String bailDecrypt;

    // long url
    @Value("${domain.url}")
    private String domainUrl;

    @Value("${egov.base.url}")
    private String baseUrl;

    @Value("${egov.long.url}")
    private String longUrl;

    @Value("${bail.bond.index}")
    private String bailBondIndex;

    @Value("${egov.indexer.es.username}")
    private String esUsername;

    @Value("${egov.indexer.es.password}")
    private String esPassword;


    @Value("${egov.infra.indexer.host}")
    private String esHostUrl;

    @Value("${egov.bulk.index.path}")
    private String bulkPath;

    //FileStore Service
    @Value("${egov.filestore.host}")
    private String fileStoreHost;

    @Value("${egov.filestore.path}")
    private String fileStorePath;

    @Value("${egov.file.store.delete.endpoint}")
    private String fileStoreDeleteEndPoint;

    //Localization
    @Value("${egov.localization.host}")
    private String localizationHost;

    @Value("${egov.localization.context.path}")
    private String localizationContextPath;

    @Value("${egov.localization.search.endpoint}")
    private String localizationSearchEndpoint;

    // sms config
    @Value("${bail.created.sms.for.surety}")
    private String BailCreatedSmsForSurety;

    @Value("${bail.created.sms.for.litigant}")
    private String BailCreatedSmsForLitigant;


    @Value("${egov.filestore.save.endpoint}")
    private String fileStoreSaveEndPoint;


    @Value("${egov.filestore.search.endpoint}")
    private String fileStoreSearchEndpoint;

    // ESign Config
    @Value("${egov.esign.host}")
    private String esignHost;

    @Value("${egov.esign.location.endpoint}")
    private String esignLocationEndPoint;

    @Value("${dristi.esign.signature.width:250}")
    private int esignSignatureWidth;

    @Value("${dristi.esign.signature.height:50}")
    private int esignSignatureHeight;

    // zone id
    @Value("${app.zone.id}")
    private String zoneId;

    @Value("${file.max.size}")
    private long maxFileSize;

    @Value("${allowed.content.types}")
    private String[] allowedContentTypes;

}
