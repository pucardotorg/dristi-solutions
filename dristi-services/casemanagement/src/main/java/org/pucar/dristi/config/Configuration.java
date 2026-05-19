package org.pucar.dristi.config;

import jakarta.annotation.PostConstruct;
import lombok.*;
import org.egov.tracer.config.TracerConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
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

	@Value("${spring.data.redis.timeout}")
	private Long redisTimeout;

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

	@Value("${egov.mdms.schema.search.endpoint}")
	private String mdmsSchemaEndPoint;

	@Value("${schemacode.state.master}")
	private String stateMasterSchema;

	@Value("${schemacode.casebundle.section.order}")
	private String caseBundleSectionOrderSchema;

	@Value("${schemacode.casebundle.master}")
	private String caseBundleMasterSchema;


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

	@Value("${egov.filestore.host}")
	private String fileStoreHost;

	@Value("${dristi.file.search.path}")
	private String fileStorePath;

	@Value("${dristi.file.delete.path}")
	private String fileStoreDeleteEndPoint;

	@Value("${dristi.order.host}")
	private String orderSearchHost;

	@Value("${dristi.order.search.url}")
	private String orderSearchPath;

	@Value("${egov.pdf.create}")
	private String generatePdfUrl;

	@Value("${egov.pdf.host}")
	private String generatePdfHost;

	@Value("${egov.credential.host}")
	private String credentialHost;

	@Value("${egov.credential.url}")
	private String credentialUrl;

	@Value("${dristi.task.host}")
	private String taskSearchHost;

	@Value("${dristi.task.search.url}")
	private String taskSearchPath;


	@Value("${egov.dristi.pdf.host}")
	private String caseBundlePdfHost;

	@Value("${egov.dristi.pdf.bundle}")
	private String caseBundlePdfPath;

	@Value("${egov.dristi.pdf.process.bundle}")
	private String processCaseBundlePdfPath;

	@Value("${dristi.case.host}")
	private String caseHost;

	@Value("${dristi.case.search.url}")
	private String caseSearchUrl;

	// Application Config
	@Value("${dristi.application.host}")
	private String applicationHost;

	@Value("${dristi.application.search.endpoint}")
	private String applicationSearchEndPoint;

	//ElasticSearch Config
	@Value("${egov.infra.indexer.host}")
	private String esHostUrl;

	@Value("${egov.indexer.es.username}")
	private String esUsername;

	@Value("${egov.indexer.es.password}")
	private String esPassword;

	@Value("${dristi.case.index}")
	private String caseIndex;

	@Value("${dristi.bundle.index}")
	private String caseBundleIndex;

	@Value("${dristi.preview.index}")
	private String casePreviewIndex;

	@Value("${dristi.hearing.index}")
	private String hearingIndex;

	@Value("${dristi.witness.index}")
	private String witnessIndex;

	@Value("${dristi.order.index}")
	private String orderIndex;

	@Value("${dristi.task.index}")
	private String taskIndex;

	@Value("${dristi.application.index}")
	private String applicationIndex;

	@Value("${dristi.artifact.index}")
	private String artifactIndex;

	@Value("${dristi.search.index.path}")
	private String searchPath;

	//Kafka
	@Value("${casemanagement.kafka.vc.create.topic}")
	private String createVc;

	@Value("${casemanagement.kafka.bundle.create.topic}")
	private String bundleCreateTopic;

	@Value("${casemanagement.kafka.update.casebundles.topic}")
	private String updateCaseBundlesTopic;

	@Value("${mdms.kafka.save.topic}")
	private String saveMdmsDataTopic;

	@Value("${mdms.kafka.update.topic}")
	private String updateMdmsDataTopic;

	@Value("${generate.vc.code}")
	private String vcCode;

	// delay time for calling process case bundle
	@Value("${casemanagement.delay.time}")
	private Integer delayTime;

	@Value("${case.allowed.status}")
	private String caseAllowedStatuses;
	private List<String> caseAllowedStatusesList = new ArrayList<>();

	// Digitalized Documents Config
	@Value("${dristi.digitalized.documents.host}")
	private String digitalizedDocumentsHost;

	@Value("${dristi.digitalized.documents.search.endpoint}")
	private String digitalizedDocumentsSearchEndPoint;

	// Task Management Config
	@Value("${dristi.taskmanagement.host}")
	private String taskManagementServiceHost;

	@Value("${dristi.taskmanagement.search.endpoint}")
	private String taskManagementSearchEndpoint;

	// Evidence Service Config
	@Value("${dristi.evidence.host}")
	private String evidenceServiceHost;

	@Value("${dristi.evidence.search.endpoint}")
	private String evidenceServiceSearchEndpoint;

	// CTC Service Config
	@Value("${dristi.ctc.host}")
	private String ctcHost;

	@Value("${dristi.ctc.search.endpoint}")
	private String ctcSearchEndpoint;

	@Value("${dristi.ctc.update.endpoint}")
	private String ctcUpdateEndpoint;

	@PostConstruct
	public void init() {
		caseAllowedStatusesList = Arrays.asList(caseAllowedStatuses.split(","));
	}

}
