package org.pucar.dristi.config;

import lombok.Getter;
import lombok.Setter;
import org.egov.tracer.config.TracerConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;


@Component
@Import({ TracerConfiguration.class })
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

	// Idgen Config
	@Value("${egov.idgen.host}")
	private String idGenHost;

	@Value("${egov.idgen.path}")
	private String idGenPath;

	// Workflow Config
	@Value("${egov.workflow.host}")
	private String wfHost;

	@Value("${egov.workflow.transition.path}")
	private String wfTransitionPath;

	@Value("${egov.workflow.businessservice.search.path}")
	private String wfBusinessServiceSearchPath;

	@Value("${egov.workflow.processinstance.search.path}")
	private String wfProcessInstanceSearchPath;

	// MDMS
	@Value("${egov.mdms.host}")
	private String mdmsHost;

	@Value("${egov.mdms.search.endpoint}")
	private String mdmsEndPoint;

	@Value("${egov.mdms.filingtype.module}")
	private String filingTypeModule;

	@Value("${egov.mdms.filingtype.master}")
	private String filingTypeMaster;

	// HRMS
	@Value("${egov.hrms.host}")
	private String hrmsHost;

	@Value("${egov.hrms.search.endpoint}")
	private String hrmsEndPoint;

	// URLShortening
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

	@Value("${egov.long.url}")
	private String longUrl;

	// SMSNotification
	@Value("${egov.sms.notification.topic}")
	private String smsNotificationTopic;

	// Evidence
	@Value("${evidence.kafka.create.topic}")
	private String evidenceCreateTopic;

	@Value("${evidence.kafka.create.withoutWorkflow.topic}")
	private String evidenceCreateWithoutWorkflowTopic;

	@Value("${evidence.kafka.update.topic}")
	private String updateEvidenceKafkaTopic;

	@Value("${evidence.kafka.update.withoutWorkflow.topic}")
	private String updateEvidenceWithoutWorkflowKafkaTopic;

	// Workflow/Business Module name
	@Value("${egov.workflow.businessservice.module}")
	private String businessServiceModule;

	@Value("${egov.workflow.businessservice.name}")
	private String businessServiceName;

	@Value("${egov.workflow.submission.businessservice.name}")
	private String submissionBusinessServiceName;

	@Value("${egov.workflow.submission.businessservice.module}")
	private String submissionBusinessServiceModule;

	@Value("${egov.workflow.witness.deposition.businessservice.name}")
	private String witnessDepositionBusinessServiceName;

	@Value("${egov.workflow.evidence.businessservice.name}")
	private String evidenceBusinessServiceName;

	// Case Config
	@Value("${egov.case.host}")
	private String caseHost;

	@Value("${egov.case.path}")
	private String caseExistsPath;

	@Value("${egov.case.search.path}")
	private String caseSearchPath;

	@Value("${egov.case.witness.add.path}")
	private String addWitnessEndpoint;

	@Value("${egov.case.update.path}")
	private String updateCaseEndpoint;

	// Application Config
	@Value("${egov.application.host}")
	private String applicationHost;

	@Value("${egov.application.path}")
	private String applicationExistsPath;

	// Order Config
	@Value("${egov.order.host}")
	private String orderHost;

	@Value("${egov.order.path}")
	private String orderExistsPath;

	@Value("${egov.courtId}")
	private String courtId;

	// Hearing Config
	@Value("${egov.hearing.host}")
	private String hearingHost;

	@Value("${egov.hearing.path}")
	private String hearingExistsPath;

	@Value("${egov.hearing.search.endpoint}")
	private String hearingSearchEndPoint;

	@Value("${evidence.kafka.comments.update.topic}")
	private String evidenceUpdateCommentsTopic;

	//Idgen
	@Value("${egov.idgen.prosecutionConfig}")
	private String prosecutionConfig;

	@Value("${egov.idgen.prosecutionFormat}")
	private String prosecutionFormat;

	//Idgen
	@Value("${egov.idgen.defenceConfig}")
	private String defenceConfig;

	@Value("${egov.idgen.defenceFormat}")
	private String defenceFormat;

	//Idgen
	@Value("${egov.idgen.courtConfig}")
	private String courtConfig;

	@Value("${egov.idgen.courtFormat}")
	private String courtFormat;

	//Idgen
	@Value("${egov.idgen.defenceWitnessConfig}")
	private String defenceWitnessConfig;

	@Value("${egov.idgen.defenceWitnessFormat}")
	private String defenceWitnessFormat;

	//Idgen
	@Value("${egov.idgen.prosecutionWitnessConfig}")
	private String prosecutionWitnessConfig;

	@Value("${egov.idgen.prosecutionWitnessFormat}")
	private String prosecutionWitnessFormat;

	//Idgen
	@Value("${egov.idgen.courtWitnessConfig}")
	private String courtWitnessConfig;

	@Value("${egov.idgen.courtWitnessFormat}")
	private String courtWitnessFormat;

	@Value("${egov.idgen.artifactFormat}")
	private String artifactFormat;

	@Value("${egov.idgen.artifactConfig}")
	private String artifactConfig;

	@Value("${egov.idgen.icopsFormat}")
	private String icopsFormat;

	@Value("${egov.idgen.icopsConfig}")
	private String icopsConfig;

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

	@Value("${egov.sms.notification.document.marked.exhibit.template.id}")
	private String smsNotificationDocumentMarkedExhibitTemplateId;

	@Value("${egov.sms.notification.document.evidence.submitted.template.id}")
	private String smsNotificationEvidenceSubmitted;

	@Value("${egov.sms.notification.document.evidence.submission.filing.party.template.id}")
	private String smsNotificationDocumentSubmissionByParty;

	@Value("${egov.sms.notification.document.evidence.submission.opposite.party.template.id}")
	private String smsNotificationDocumentSubmissionToOppositeParty;

    @Value("${egov.sms.notification.witness.deposition.template.id}")
    private String smsNotificationWitnessDeposition;

	@Value("${egov.sms.notification.document.submitted.template.id}")
	private String smsNotificationDocumentSubmittedTemplateId;

	// zone id
	@Value("${app.zone.id}")
	private String zoneId;

	// ESign Config
	@Value("${egov.esign.host}")
	private String esignHost;

	@Value("${egov.esign.location.endpoint}")
	private String esignLocationEndPoint;

	@Value("${dristi.esign.signature.width:250}")
	private int esignSignatureWidth;

	@Value("${dristi.esign.signature.height:50}")
	private int esignSignatureHeight;

	//FileStore Service
	@Value("${egov.filestore.host}")
	private String fileStoreHost;

	@Value("${egov.filestore.path}")
	private String fileStorePath;

	@Value("${egov.file.store.delete.endpoint}")
	private String fileStoreDeleteEndPoint;

	@Value("${egov.filestore.search.endpoint}")
	private String fileStoreSearchEndpoint;

	@Value("${egov.filestore.save.endpoint}")
	private String fileStoreSaveEndPoint;

	@Value("${file.max.size}")
	private long maxFileSize;

	@Value("${allowed.content.types}")
	private String[] allowedContentTypes;

	//Email
	@Value("${egov.mail.notification.topic}")
	private String mailNotificationTopic;

	// ADiary config

	@Value("${egov.adiary.host}")
	private String aDiaryHost;

	@Value("${egov.adiary.create.bulk}")
	private String aDiaryCreateBulkEndPoint;

	// Advocate Config
	@Value("${egov.advocate.host}")
	private String advocateHost;

	@Value("${egov.advocate.path}")
	private String advocatePath;

	//ES configs
	@Value("${egov.indexer.es.username}")
	private String esUsername;

	@Value("${egov.indexer.es.password}")
	private String esPassword;

	@Value("${egov.infra.indexer.host}")
	private String esHostUrl;

	@Value("${egov.bulk.index.path}")
	private String bulkPath;

	// inbox config
	@Value("${egov.inbox.host}")
	private String inboxHost;

	@Value("${egov.inbox.search.endpoint}")
	private String indexSearchEndPoint;

	@Value("${egov.bulk.open.artifact.index}")
	private String openArtifactIndex;

	@Value("${state.level.tenant.id}")
	private String tenantId;


}
