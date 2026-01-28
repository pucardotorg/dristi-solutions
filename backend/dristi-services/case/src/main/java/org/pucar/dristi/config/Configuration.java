package org.pucar.dristi.config;

import org.egov.tracer.config.TracerConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Component
@Data
@Import({ TracerConfiguration.class })
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class Configuration {

	//Hearing
	@Value("${egov.hearing.host}")
	private String hearingHost;

	@Value("${egov.hearing.path}")
	private String hearingPath;

	@Value("${egov.hearing.search.path}")
	private String hearingSearchPath;

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

	@Value("${egov.idgen.caseFilingNumberCp}")
	private String caseFilingNumberCp;

	@Value("${egov.idgen.caseFilingNumberNia}")
	private String caseFilingNumberNia;

	@Value("${egov.idgen.caseNumberCc}")
	private String caseNumberCc;

	@Value("${egov.idgen.caseNumberWp}")
	private String caseNumberWp;


	// Filestore Config
	@Value("${egov.filestore.host}")
	private String fileStoreHost;

	@Value("${egov.filestore.path}")
	private String fileStorePath;

	// Advocate Config
	@Value("${egov.advocate.host}")
	private String advocateHost;

	@Value("${egov.advocate.path}")
	private String advocatePath;

    //Individual Service
    @Value("${egov.individual.host}")
    private String individualHost;

    @Value("${egov.individual.path}")
    private String individualPath;

    @Value("${egov.individual.create.path}")
    private String individualCreateEndpoint;

    @Value("${egov.individual.search.path}")
    private String individualSearchEndpoint;

    // Advocate Office Management Config
    @Value("${dristi.advocate.office.host}")
    private String advocateOfficeHost;

    @Value("${dristi.advocate.office.search.member.endpoint}")
    private String advocateOfficeSearchMemberEndpoint;

    @Value("${egov.individual.update.path}")
    private String individualUpdateEndpoint;

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

	// SMSNotification
	@Value("${egov.sms.notification.topic}")
	private String smsNotificationTopic;

	//Case
	@Value("${case.kafka.update.topic}")
	private String caseUpdateTopic;

	@Value("${case.kafka.create.topic}")
	private String caseCreateTopic;

	@Value("${case.kafka.status.update.topic}")
	private String caseUpdateStatusTopic;

	@Value("${case.kafka.edit.topic}")
	private String caseEditTopic;

	@Value("${witness.kafka.create.topic}")
	private String witnessCreateTopic;

	@Value("${witness.kafka.update.topic}")
	private String witnessUpdateTopic;

	@Value("${case.kafka.add.address.topic}")
	private String addAddressTopic;

	@Value("${egov.workflow.case.business.name}")
	private String caseBusinessName;

	@Value("${egov.workflow.case.business.service.name}")
	private String caseBusinessServiceName;

	//Billing
	@Value("${egov.billing.host}")
	private String billingHost;

	@Value("${egov.demand.create.endpoint}")
	private String demandCreateEndPoint;

	//Billing
	@Value("${egov.etreasury.host}")
	private String etreasuryHost;

	@Value("${egov.etreasury.demand.create.endpoint}")
	private String etreasuryDemandCreateEndPoint;

	@Value("${etreasury.payment.receipt.endpoint}")
	private String treasuryPaymentReceiptEndPoint;

	@Value("${etreasury.head.breakup.calculation.endpoint}")
	private String etreasuryCalculationEndPoint;

	//Join a Case
	@Value("${egov.litigant.join.case.kafka.topic}")
	private String litigantJoinCaseTopic;

	@Value("${egov.representative.join.case.kafka.topic}")
	private String representativeJoinCaseTopic;

	@Value("${egov.update.representative.join.case.kafka.topic}")
	private String updateRepresentativeJoinCaseTopic;

	@Value("${egov.additional.join.case.kafka.topic}")
	private String additionalJoinCaseTopic;

	@Value("${egov.update.additional.join.case.kafka.topic}")
	private String updateAdditionalJoinCaseTopic;

	//Mdms

	@Value("${mdms.case.module.name}")
	private String caseModule;

	@Value("${state.level.tenant.id}")
	private String tenantId;

	@Value("${egov.localization.statelevel}")
	private Boolean isLocalizationStateLevel;

	//Dristi Case Pdf Service
	@Value("${egov.dristi.case.pdf.host}")
	private String dristiCasePdfHost;

	@Value("${egov.dristi.case.pdf.path}")
	private String dristiCasePdfPath;

	@Value("${egov.file.store.save.endpoint}")
	private String fileStoreSaveEndPoint;

	@Value("${egov.file.store.delete.endpoint}")
	private String fileStoreDeleteEndPoint;

	@Value("${egov.filestore.case.module}")
	private String fileStoreCaseModule;


	@Value("${egov.sms.notification.template.id}")
	private String smsNotificationTemplateId;

	@Value("${egov.sms.notification.payment.pending.template.id}")
	private String smsNotificationPaymentPendingTemplateId;

	@Value("${egov.sms.notification.esign.pending.template.id}")
	private String smsNotificationEsignPendingTemplateId;

	@Value("${egov.sms.notification.new.witness.added.template.id}")
	private String smsNotificationWitnessAddedTemplateId;

	@Value("${egov.sms.notification.new.witness.added.for.others.template.id}")
	private String smsNotificationWitnessAddedForOthersTemplateId;

	@Value("${egov.sms.notification.advocate.esign.pending.template.id}")
	private String smsNotificationAdvocateEsignPendingTemplateId;

	@Value("${egov.sms.notification.case.submit.template.id}")
	private String smsNotificationCaseSubmittedTemplateId;

	@Value("${egov.sms.notification.case.payment.complete.template.id}")
	private String smsNotificationCasePaymentCompletionTemplateId;

	@Value("${egov.sms.notification.case.fso.validate.template.id}")
	private String smsNotificationCaseFsoValidationTemplateId;

	@Value("${egov.sms.notification.case.fso.send.back.template.id}")
	private String smsNotificationCaseFsoSendBackTemplateId;

	@Value("${egov.sms.notification.case.judge.assigned.template.id}")
	private String smsNotificationCaseJudgeAssignedTemplateId;

	@Value("${egov.sms.notification.case.judge.send.back.template.id}")
	private String smsNotificationCaseJudgeSendBackTemplateId;

	@Value("${egov.sms.notification.case.judge.register.template.id}")
	private String smsNotificationCaseJudgeRegisterTemplateId;

	@Value("${egov.sms.notification.admission.hearing.scheduled.template.id}")
	private String smsNotificationAdmissionHearingScheduledTemplateId;

	@Value("${egov.sms.notification.advocate.join.case.template.id}")
	private String smsNotificationAdvocateJoinCaseTemplateId;

	@Value("${egov.sms.notification.case.admitted.template.id}")
	private String smsNotificationCaseAdmittedTemplateId;

	@Value("${egov.sms.notification.case.dismissed.template.id}")
	private String smsNotificationCaseDismissedTemplateId;

	@Value("${egov.sms.notification.new.user.join.template.id}")
	private String smsNotificationNewUserJoinTemplateId;

	@Value("${notification.sms.enabled}")
	private Boolean isSMSEnabled;

	@Value("${egov.sms.notification.accept.profile.request.template.id}")
	private String smsNotificationAcceptProfileRequestTemplateId;

	@Value("${egov.sms.notification.reject.profile.request.template.id}")
	private String smsNotificationRejectProfileRequestTemplateId;

	@Value("${egov.sms.notification.errors.pending.template.id}")
	private String smsNotificationErrorsPendingTemplateId;

	@Value("${egov.sms.notification.vakalatnama.filed.template.id}")
	private String smsNotificationVakalatnamaFiledTemplateId;

	//Localization
	@Value("${egov.localization.host}")
	private String localizationHost;

	@Value("${egov.localization.context.path}")
	private String localizationContextPath;

	@Value("${egov.localization.search.endpoint}")
	private String localizationSearchEndpoint;

	// Default User
	@Value("${egov.default.user.username}")
	private String defaultUserUserName;

	@Value("${egov.default.user.password}")
	private String defaultUserPassword;

	@Value("${egov.user.notification.period}")
	private String userNotificationPeriod;

	@Value("${user.oauth.url}")
	private String userOauthUrl;

	@Value("${spring.redis.timeout}")
	private Long redisTimeout;

	//	Models for encryption decryption in MDMS
	@Value("${egov.enc.mdms.security.policy.court.case}")
	private String courtCaseEncrypt;

	@Value("${egov.enc.mdms.security.policy.case.decrypt.self}")
	private String caseDecryptSelf;

	@Value("${egov.enc.mdms.security.policy.court.case.new}")
	private String courtCaseEncryptNew;

	@Value("${egov.enc.mdms.security.policy.case.decrypt.self.new}")
	private String caseDecryptSelfNew;

	@Value("${egov.enc.mdms.security.policy.court.decrypt.other}")
	private String caseDecryptOther;

	//Idgen updated
	@Value("${egov.idgen.caseFilingConfig}")
	private String caseFilingConfig;

	@Value("${egov.idgen.caseFilingFormat}")
	private String caseFilingFormat;

	@Value("${egov.idgen.caseCNRConfig}")
	private String caseCNRConfig;

	@Value("${egov.idgen.caseCNRFormat}")
	private String caseCNRFormat;

	@Value("${egov.idgen.courtCaseConfig}")
	private String courtCaseConfig;

	@Value("${egov.idgen.courtCaseSTFormat}")
	private String courtCaseSTFormat;

	@Value("${egov.idgen.cmpConfig}")
	private String cmpConfig;

	@Value("${egov.idgen.cmpFormat}")
	private String cmpFormat;

	//Indexer
	@Value("${indexer.join.case.kafka.topic}")
	private String joinCaseTopicIndexer;

	@Value("${pucar.lock.host}")
	private String lockSvcHost;

	@Value("${pucar.lock.search.endpoint}")
	private String lockEndPoint;

	@Value("${egov.payment.calculator.host}")
	private String paymentCalculatorHost;

	@Value("${egov.courtId}")
	private String courtId;

	@Value("${egov.payment.calculator.endpoint}")
	private String paymentCalculatorEndpoint;

	@Value("${egov.case.filing.payment.calculator.endpoint}")
	private String caseFilingPaymentCalculatorEndpoint;

	@Value("${egov.task.service.host}")
	private String taskServiceHost;

	@Value("${egov.task.service.create.endpoint}")
	private String taskServiceCreateEndpoint;

	@Value("${egov.task.service.search.endpoint}")
	private String taskServiceSearchEndpoint;

	@Value("${egov.task.service.update.endpoint}")
	private String taskServiceUpdateEndpoint;

	@Value("${hearing.case.reference.number.update}")
	private String caseReferenceUpdateTopic;

	@Value("${egov.analytics.host}")
	private String analyticsServiceHost;

	@Value("${egov.analytics.path}")
	private String analyticsServicePath;

	@Value("${egov.pending.advocate.request.join.case.kafka.topic}")
	private String updatePendingAdvocateRequestKafkaTopic;
  
	@Value("${kafka.case.update.last.modified.time}")
	private String caseUpdateLastModifiedTimeTopic;

	@Value("${egov.poa.join.case.kafka.topic}")
	private String poaJoinCaseKafkaTopic;

	// evidence
	@Value("${egov.evidence.host}")
	private String evidenceServiceHost;

	@Value("${egov.evidence.create.path}")
	private String evidenceServiceCreatePath;

	@Value("${egov.evidence.search.path}")
	private String evidenceServiceSearchPath;

	// LPR config
	@Value("${egov.idgen.lprConfig}")
	private String lprConfig;

	@Value("${egov.idgen.lprFormat}")
	private String lprFormat;

	@Value("${lpr.case.details.update.kafka.topic}")
	private String lprCaseDetailsUpdateTopic;

    @Value("${lpr.stage}")
    private String lprStage;

    @Value("${lpr.sub.stage}")
    private String lprSubStage;

	// Time config for async SMS
	@Value("${egov.sms.case.filed.time}")
	private String smsCaseFiledTime;

	@Value("${egov.sms.vakalatnama.filed.time}")
	private String smsVakalatnamaFiledTime;

	// Order
	@Value("${egov.order.host}")
	private String orderHost;

	@Value("${egov.order.search.endpoint}")
	private String orderSearchEndpoint;

	@Value("${app.zone.id}")
	private String zoneId;

	// inbox config
	@Value("${egov.inbox.host}")
	private String inboxHost;

	@Value("${egov.inbox.search.endpoint}")
	private String indexSearchEndPoint;

	@Value("${open.hearing.topic}")
	private String openHearingTopic;

	@Value("${case.conversion.topic}")
	private String caseConversionTopic;

	@Value("${advocate.office.case.member.save.topic}")
	private String advocateOfficeCaseMemberSaveTopic;

	@Value("${advocate.office.case.member.update.topic}")
	private String advocateOfficeCaseMemberUpdateTopic;
}
