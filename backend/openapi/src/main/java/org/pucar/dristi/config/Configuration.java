package org.pucar.dristi.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;
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
}
