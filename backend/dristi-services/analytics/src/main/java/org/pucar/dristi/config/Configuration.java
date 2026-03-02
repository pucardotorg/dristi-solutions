package org.pucar.dristi.config;

import jakarta.annotation.PostConstruct;
import lombok.*;
import org.egov.tracer.config.TracerConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@Data
@Import({TracerConfiguration.class})
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class Configuration {

	//ElasticSearch Config
	@Value("${egov.infra.indexer.host}")
	private String esHostUrl;

	@Value("${egov.demand.host}")
	private String demandHost;

	@Value("${egov.demand.end.point}")
	private String demandEndPoint;

	@Value("${elasticsearch.poll.interval.seconds}")
	private String pollInterval;

	@Value("${egov.bulk.index}")
	private String index;

	@Value("${billing.index}")
	private String billingIndex;

	@Value("${egov.case.overall.status.topic}")
	private String caseOverallStatusTopic;

	@Value("${egov.case.outcome.topic}")
	private String caseOutcomeTopic;

	@Value("${egov.bulk.index.path}")
	private String bulkPath;

	@Value("${egov.indexer.es.username}")
	private String esUsername;

	@Value("${egov.indexer.es.password}")
	private String esPassword;

	@Value("${id.timezone}")
	private String timezone;

	@Value("${egov.statelevel.tenantId}")
	private  String stateLevelTenantId;

	//Hearing Config
	@Value("${egov.hearing.host}")
	private String hearingHost;

	@Value("${egov.hearing.search.endpoint}")
	private String hearingSearchPath;

	//Case Config
	@Value("${egov.case.host}")
	private String caseHost;

	@Value("${egov.case.search.endpoint}")
	private String caseSearchPath;

	@Value("${egov.advocate.case.search.endpoint}")
	private String advocateCaseSearchPath;

	@Value("${egov.case.member.advocates.endpoint}")
	private String caseMemberAdvocatesPath;

	//Evidence Config
	@Value("${egov.evidence.host}")
	private String evidenceHost;

	@Value("${egov.evidence.search.endpoint}")
	private String evidenceSearchPath;

	//Task Config
	@Value("${egov.task.host}")
	private String taskHost;

	@Value("${egov.task.search.endpoint}")
	private String taskSearchPath;

	//Application Config
	@Value("${egov.application.host}")
	private String applicationHost;

	@Value("${egov.application.search.endpoint}")
	private String applicationSearchPath;

	//Order Config
	@Value("${egov.order.host}")
	private String orderHost;

	@Value("${egov.order.search.endpoint}")
	private String orderSearchPath;

	@Value("${api.call.delay.in.seconds}")
	private Integer apiCallDelayInSeconds;

	// MDMS Config
	@Value("${egov.mdms.host}")
	private String mdmsHost;

	@Value("${egov.mdms.search.endpoint}")
	private String mdmsEndPoint;

	@Value("${egov.mdms.pending.task.module.name}")
	private String mdmsPendingTaskModuleName;

	@Value("${egov.mdms.pending.task.master.name}")
	private String mdmsPendingTaskMasterName;

	@Value("${egov.mdms.case.overall.status.module.name}")
	private String mdmsCaseOverallStatusModuleName;

	@Value("${egov.mdms.case.overall.status.master.name}")
	private String mdmsCaseOverallStatusMasterName;

	@Value("${egov.mdms.case.outcome.module.name}")
	private String mdmsCaseOutcomeModuleName;

	@Value("${egov.mdms.case.outcome.master.name}")
	private String mdmsCaseOutcomeMasterName;

	@Value("${egov.mdms.assignee.to.office.members.module.name}")
	private String mdmsAssigneeToOfficeMembersModuleName;

	@Value("${egov.mdms.assignee.to.office.members.master.name}")
	private String mdmsAssigneeToOfficeMembersMasterName;

	@Value("${create.demand.topic.name}")
	private String demandGenerateTopic;


	@Value("${create.payment.collection.topic.name}")
	private String paymentCollectTopic;

	@Value("${egov.hearing.business.services}")
	private String hearingBusinessServices;
	private List<String> hearingBusinessServiceList;

	@Value("${egov.case.business.services}")
	private String caseBusinessServices;
	private List<String> caseBusinessServiceList;

	@Value("${egov.evidence.business.services}")
	private String evidenceBusinessServices;
	private List<String> evidenceBusinessServiceList;

	@Value("${egov.task.business.services}")
	private String taskBusinessServices;
	private List<String> taskBusinessServiceList;

    @Value("${egov.task.management.business.services}")
    private String taskManagementBusinessServices;
    private List<String> taskManagementBusinessServiceList;

    @Value("${egov.digitalized.documents.business.services}")
    private String digitalizedDocumentsBusinessServices;
    private List<String> digitalizedDocumentsBusinessServiceList;

	@Value("${egov.application.business.services}")
	private String applicationBusinessServices;
	private List<String> applicationBusinessServiceList;

	@Value("${egov.order.business.services}")
	private String orderBusinessServices;
	private List<String> orderBusinessServiceList;

	@Value("${egov.adiary.business.services}")
	private String aDiaryBusinessServices;
	private List<String> aDiaryBusinessServiceList;

	@Value("${egov.bail.bond.business.services}")
	private String bailBondBusinessServices;
	private List<String> bailBondBusinessServiceList;

	//Localization
	@Value("${egov.localization.host}")
	private String localizationHost;

	@Value("${egov.localization.context.path}")
	private String localizationContextPath;

	@Value("${egov.localization.search.endpoint}")
	private String localizationSearchEndpoint;

	// SMSNotification
	@Value("${egov.sms.notification.topic}")
	private String smsNotificationTopic;

	//Individual Service
	@Value("${egov.individual.host}")
	private String individualHost;

	@Value("${egov.individual.search.path}")
	private String individualSearchEndpoint;

	@Value("${egov.sms.notification.pending.task.created.template.id}")
	private String smsNotificationPendingTaskCreatedTemplateId;

	@Value("${egov.sms.notification.case.status.changed.template.id}")
	private String smsNotificationCaseStatusChangeTemplateId;

	// Advocate Config
	@Value("${egov.advocate.host}")
	private String advocateHost;

	@Value("${egov.advocate.path}")
	private String advocatePath;

	//Elasticsearch config

	@Value("${elastic.pending.task.endpoint}")
	private String pendingTaskIndexEndpoint;

	@Value("${elastic.pending.task.search}")
	private String pendingTaskSearchPath;

	// User Config
	@Value("${egov.user.host}")
	private String userHost;

	@Value("${egov.user.search.path}")
	private String userSearchEndpoint;

	@Value("${egov.user.create.path}")
	private String userCreateEndpoint;

	//Tenant Id
	@Value("${egov-state-level-tenant-id}")
	private String egovStateTenantId;

	// LPR config
	@Value("${lpr.stage}")
	private String lprStage;

	@Value("${lpr.sub.stage}")
	private String lprSubStage;

    // case section and sub section
    @Value("${case.section.and.sub.section}")
    private String caseSectionAndSubSection;

	// task management config
	@Value("${dristi.task-management.host}")
	private String taskManagementServiceHost;

	@Value("${dristi.task-management.search.endpoint}")
	private String taskManagementSearchEndpoint;

	// Workflow Service config
	@Value("${egov.workflow.host}")
	private String workflowHost;

	@Value("${egov.workflow.assignee.upsert.endpoint}")
	private String workflowAssigneeUpsertEndpoint;

	@Value("${egov.workflow.assignee.search.endpoint}")
	private String workflowAssigneeSearchEndpoint;

	@Value("${egov.workflow.process.search.endpoint}")
	private String workflowProcessSearchEndpoint;

	@Value("${spring.redis.timeout}")
	private Long redisTimeout;

	@PostConstruct
	public void init() {
		hearingBusinessServiceList = Arrays.asList(hearingBusinessServices.split(","));
		caseBusinessServiceList = Arrays.asList(caseBusinessServices.split(","));
		evidenceBusinessServiceList = Arrays.asList(evidenceBusinessServices.split(","));
		taskBusinessServiceList = Arrays.asList(taskBusinessServices.split(","));
        taskManagementBusinessServiceList = Arrays.asList(taskManagementBusinessServices.split(","));
		digitalizedDocumentsBusinessServiceList = Arrays.asList(digitalizedDocumentsBusinessServices.split(","));
		applicationBusinessServiceList = Arrays.asList(applicationBusinessServices.split(","));
		orderBusinessServiceList = Arrays.asList(orderBusinessServices.split(","));
		aDiaryBusinessServiceList = Arrays.asList(aDiaryBusinessServices.split(","));
		bailBondBusinessServiceList = Arrays.asList(bailBondBusinessServices.split(","));
	}

	@Value("${app.zone.id}")
	private String zoneId;

}
