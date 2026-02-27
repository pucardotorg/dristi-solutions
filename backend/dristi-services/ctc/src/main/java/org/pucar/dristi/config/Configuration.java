package org.pucar.dristi.config;

import lombok.Getter;
import lombok.Setter;
import org.egov.tracer.config.TracerConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

@Component
@Import({TracerConfiguration.class})
@Setter
@Getter
public class Configuration {

    // User Config
    @Value("${egov.idgen.caConfig}")
    private String caConfig;

    @Value("${egov.idgen.caFormat}")
    private String caFormat;

    @Value("${egov.workflow.ctc.business.name}")
    private String ctcBusinessName;

    @Value("${egov.workflow.ctc.business.service.name}")
    private String ctcBusinessServiceName;

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

    @Value("${egov.courtId}")
    private String courtId;

    //Idgen Config
    @Value("${egov.idgen.host}")
    private String idGenHost;

    @Value("${egov.idgen.path}")
    private String idGenPath;

    // Case Config
    @Value("${egov.case.host}")
    private String caseHost;

    @Value("${egov.case.path}")
    private String casePath;

    @Value("${egov.case.search.path}")
    private String caseSearchPath;

    @Value("${egov.case.list.search.path}")
    private String caseListSearchPath;

    // Hearing Config
    @Value("${egov.hearing.host}")
    private String hearingHost;

    @Value("${egov.hearing.search.path}")
    private String hearingSearchPath;

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

    //save order kafka topic
    @Value("${egov.kafka.order.save.topic}")
    private String saveOrderKafkaTopic;

    //update order kafka topic
    @Value("${egov.kafka.order.update.topic}")
    private String updateOrderKafkaTopic;

    //update order unique id kafka topic
    @Value("${egov.kafka.order.update.uniqueid.topic}")
    private String orderUpdateUniqueIdTopic;

    @Value("${egov.workflow.order.business.name}")
    private String orderBusinessName;

    // Order Workflow/Business Service name
    @Value("${egov.workflow.order.business.service.name}")
    private String orderBusinessServiceName;

    @Value("${egov.workflow.order.judgement.business.name}")
    private String orderJudgementBusinessName;

    // Order Workflow/Business Service name
    @Value("${egov.workflow.order.judgement.business.service.name}")
    private String orderJudgementBusinessServiceName;

    //MDMS validation
    @Value("${mdms.order.type.path}")
    private String orderTypePath;

    @Value("${mdms.order.category.path}")
    private String orderCategoryPath;

    @Value("${mdms.order.module.name}")
    private String orderModule;

    @Value("${egov.mdms.order.nonoverlapping.composite.orders}")
    private String mdmsNonOverlappingOrders;

    @Value("${egov.mdms.order.nonrepeating.composite.orders}")
    private String mdmsNonRepeatingCompositeOrders;

    @Value("${egov.mdms.itemtext}")
    private String mdmsItemText;

    // Filestore Config
    @Value("${egov.filestore.host}")
    private String fileStoreHost;

    @Value("${egov.filestore.path}")
    private String fileStorePath;

    @Value("${egov.file.store.delete.endpoint}")
    private String fileStoreDeleteEndPoint;

    //Idgen
    @Value("${egov.idgen.orderConfig}")
    private String orderConfig;

    @Value("${egov.idgen.orderFormat}")
    private String orderFormat;

    @Value("${egov.documenttype.path}")
    private String documentTypePath;

    //Localization
    @Value("${egov.localization.host}")
    private String localizationHost;

    @Value("${egov.localization.context.path}")
    private String localizationContextPath;

    @Value("${egov.localization.search.endpoint}")
    private String localizationSearchEndpoint;

    //Individual Service
    @Value("${egov.individual.host}")
    private String individualHost;

    @Value("${egov.individual.search.path}")
    private String individualSearchEndpoint;

    //advocate
    @Value("${egov.advocate.host}")
    private String advocateHost;

    @Value("${egov.advocate.path}")
    private String advocatePath;

    @Value("${egov.tenantId}")
    private String tenantId;

    // Zone ID
    @Value("${app.zone.id}")
    private String zoneId;
}
