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

    @Value("${kafka.topics.hearing.update}")
    private String hearingUpdateTopic;

    @Value("${kafka.topics.hearing.create}")
    private String hearingCreateTopic;

    //Individual Service
    @Value("${egov.individual.host}")
    private String individualHost;

    @Value("${egov.individual.path}")
    private String individualPath;

    @Value("${egov.individual.create.path}")
    private String individualCreateEndpoint;

    @Value("${egov.individual.search.path}")
    private String individualSearchEndpoint;

    @Value("${egov.individual.update.path}")
    private String individualUpdateEndpoint;

    // Advocate Workflow/Business name
    @Value("${egov.workflow.hearing.business.name}")
    private String hearingBusinessName;

    // Advocate Workflow/Business Service name
    @Value("${egov.workflow.hearing.business.service.name}")
    private String hearingBusinessServiceName;

    // MDMS Hearing module name
    @Value("${egov.mdms.module.name}")
    private String mdmsHearingModuleName;

    // MDMS Hearing Type Master List name
    @Value("${egov.mdms.hearing.type.master.name}")
    private String mdmsHearingTypeMasterName;

    // Case Config
    @Value("${egov.case.host}")
    private String caseHost;

    @Value("${egov.case.path}")
    private String caseExistsPath;

    @Value("${egov.case.search.path}")
    private String caseSearchPath;

    // Application Config
    @Value("${egov.application.host}")
    private String applicationHost;

    @Value("${egov.application.path}")
    private String applicationExistsPath;

    @Value("${verify.attendee.individual.id}")
    private Boolean verifyAttendeeIndividualId;

    @Value("${update.start.end.time.topic}")
    public String startEndTimeUpdateTopic;

    // Filestore Config
    @Value("${egov.filestore.host}")
    private String fileStoreHost;

    @Value("${egov.filestore.path}")
    private String fileStorePath;

    @Value("${egov.file.store.delete.endpoint}")
    private String fileStoreDeleteEndPoint;

    @Value("${app.zone.id}")
    private String zoneId;


    // Pdf Config
    @Value("${egov.pdf.create}")
    private String generatePdfUrl;
    @Value("${egov.pdf.host}")
    private String generatePdfHost;

    @Value("${egov.pdf.witness.key}")
    private String witnessPdfKey;

    @Value("${egov.idgen.hearingConfig}")
    private String hearingConfig;

    @Value("${egov.idgen.hearingFormat}")
    private String hearingFormat;

    //Localization
    @Value("${egov.localization.host}")
    private String localizationHost;

    @Value("${egov.localization.context.path}")
    private String localizationContextPath;

    @Value("${egov.localization.search.endpoint}")
    private String localizationSearchEndpoint;

    @Value("${egov.sms.notification.hearing.adjourned.template.id}")
    private String smsNotificationHearingAdjournedTemplateId;

    @Value("${dristi.scheduler.host}")
    private String schedulerHost;

    @Value("${dristi.scheduler.create.endpoint}")
    private String schedulerCreateEndPoint;

    @Value("${dristi.scheduler.calendar.update.endpoint}")
    private String judgeCalendarUpdateEndPoint;

    @Value("${dristi.scheduler.bulk.reschedule.endpoint}")
    private String bulkRescheduleEndPoint;

    @Value("${dristi.scheduler.search.endpoint}")
    private String schedulerSearchEndpoint;

    @Value("${dristi.scheduler.update.endpoint}")
    private String schedulerUpdateEndpoint;

    @Value("${bulk.reschedule.topic}")
    private String bulkRescheduleTopic;

    // inbox config
    @Value("${egov.inbox.host}")
    private String inboxHost;

    @Value("${egov.inbox.search.endpoint}")
    private String indexSearchEndPoint;


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


    // template for generic message of hearing types
    @Value("${egov.sms.notification.judge.scheduled.variable.hearing.template.id}")
    private String smsNotificationVariableHearingScheduled;
}
