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

    //Case
    @Value("${task.kafka.update.topic}")
    private String taskUpdateTopic;

    @Value("${task.kafka.join.case.update.topic}")
    private String taskJoinCaseUpdateTopic;

    @Value("${task.kafka.create.topic}")
    private String taskCreateTopic;

    @Value("${task.kafka.summon.topic}")
    private String taskIssueSummonTopic;

    @Value("${egov.workflow.task.join.case.business.name}")
    private String taskjoinCaseBusinessName;

    @Value("${egov.workflow.task.join.case.business.service.name}")
    private String taskJoinCaseBusinessServiceName;

    @Value("${egov.workflow.task.business.name}")
    private String taskBusinessName;

    @Value("${egov.workflow.task.business.service.name}")
    private String taskBusinessServiceName;

    @Value("${egov.workflow.task.bail.business.name}")
    private String taskBailBusinessName;

    @Value("${egov.workflow.task.bail.business.service.name}")
    private String taskBailBusinessServiceName;

    @Value("${egov.workflow.task.summon.business.name}")
    private String taskSummonBusinessName;

    @Value("${egov.workflow.task.notice.business.name}")
    private String taskNoticeBusinessName;

    @Value("${egov.workflow.task.summon.business.service.name}")
    private String taskSummonBusinessServiceName;

    @Value("${egov.workflow.task.notice.business.service.name}")
    private String taskNoticeBusinessServiceName;

    @Value("${egov.workflow.task.warrant.business.name}")
    private String taskWarrantBusinessName;

    @Value("${egov.workflow.task.warrant.business.service.name}")
    private String taskWarrantBusinessServiceName;

    @Value("${egov.workflow.task.join.case.business.name}")
    private String taskJoinCaseBusinessService;

    @Value("${egov.workflow.task.join.case.business.service.name}")
    private String taskJoinCaseBusinessServiceName;

    @Value("${task.join.case.approved.topic}")
    private String taskJoinCaseApprovedTopic;

    @Value("${task.join.case.rejected.topic}")
    private String taskJoinCaseRejectedTopic;

    @Value("${egov.idgen.taskNumber}")
    private String taskNumber;

    // Case Config
    @Value("${egov.case.host}")
    private String caseHost;

    @Value("${egov.case.path}")
    private String casePath;

    // Order Config
    @Value("${egov.order.host}")
    private String orderHost;

    @Value("${egov.order.path}")
    private String orderPath;

    @Value("${summons.court.fees.sufix}")
    private String summonsCourtFeesSufix;

    @Value("${summons.epost.fees.sufix}")
    private String summonsEpostFeesSufix;


    @Value("${egov.billingservice.host}")
    private String billingServiceHost;

    @Value("${egov.billingservice.search.bill}")
    private String searchBillEndpoint;

    @Value(("${task.business.service}"))
    private String taskBusinessService;

    //Idgen
    @Value("${egov.idgen.taskConfig}")
    private String taskConfig;

    @Value("${egov.idgen.taskFormat}")
    private String taskFormat;

    @Value("${egov.idgen.summonIdFormat}")
    private String summonIdFormat;

    @Value("${egov.idgen.bailIdFormat}")
    private String bailIdFormat;

    @Value("${egov.idgen.warrantIdFormat}")
    private String warrantIdFormat;

    @Value("${role.system.admin}")
    private String systemAdmin;

    @Value("${egov.case.search.endpoint}")
    private String caseSearchPath;

    //Localization
    @Value("${egov.localization.host}")
    private String localizationHost;

    @Value("${egov.localization.context.path}")
    private String localizationContextPath;

    @Value("${egov.localization.search.endpoint}")
    private String localizationSearchEndpoint;

    @Value("${egov.sms.notification.notice.delivered.template.id}")
    private String smsNotificationNoticeDeliveredTemplateId;

    @Value("${egov.sms.notification.notice.delivery.failed.template.id}")
    private String smsNotificationNoticeNotDeliveredTemplateId;

    @Value("${egov.sms.notification.summons.delivered.template.id}")
    private String smsNotificationSummonsDeliveredTemplateId;

    @Value("${egov.sms.notification.summons.delivery.failed.template.id}")
    private String smsNotificationSummonsNotDeliveredTemplateId;

    @Value("${egov.sms.notification.warrant.issued.template.id}")
    private String smsNotificationWarrantIssuedTemplateId;

    @Value("${egov.sms.notification.warrant.delivered.template.id}")
    private String smsNotificationWarrantDeliveredTemplateId;

    @Value("${egov.sms.notification.warrant.not.delivered.template.id}")
    private String smsNotificationWarrantNotDeliveredTemplateId;

    @Value("${egov.sms.notification.warrant.issued.success.template.id}")
    private String smsNotificationWarrantIssueSuccess;

    //Individual Service
    @Value("${egov.individual.host}")
    private String individualHost;

    @Value("${egov.individual.search.path}")
    private String individualSearchEndpoint;
}
