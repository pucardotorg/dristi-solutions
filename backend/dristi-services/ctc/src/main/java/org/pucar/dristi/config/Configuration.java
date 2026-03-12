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

    // Filestore Config
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

    //Individual Service
    @Value("${egov.individual.host}")
    private String individualHost;

    @Value("${egov.individual.search.path}")
    private String individualSearchEndpoint;

    //Etreasury Config
    @Value("${egov.etreasury.host}")
    private String etreasuryHost;

    @Value("${egov.etreasury.demand.create.endpoint}")
    private String etreasuryDemandCreateEndPoint;

    @Value("${egov.etreasury.payment.receipt.endpoint}")
    private String etreasuryPaymentReceiptEndPoint;

    @Value("${egov.tenantId}")
    private String tenantId;

    //Elasticsearch Config
    @Value("${egov.indexer.es.username}")
    private String esUsername;

    @Value("${egov.indexer.es.password}")
    private String esPassword;

    @Value("${egov.infra.indexer.host}")
    private String esHostUrl;

    @Value("${egov.bulk.index.path}")
    private String bulkPath;

    @Value("${ctc.issue.documents.index}")
    private String issueCtcDocumentsIndex;

    @Value("${spring.redis.timeout}")
    private Long redisTimeout;

    // Zone ID
    @Value("${app.zone.id}")
    private String zoneId;

    // topics
    @Value("${app.kafka.topics.save.ctc.application}")
    private String saveCtcApplicationTopic;

    @Value("${app.kafka.topics.update.ctc.application}")
    private String updateCtcApplicationTopic;

    @Value("${break.down.code}")
    private String breakDownCode;

    @Value("${break.down.type}")
    private String breakDownType;

    @Value("${ctc.application.tracker.index}")
    private String ctcApplicationTrackerIndex;

    // ESign Config
    @Value("${egov.esign.host}")
    private String esignHost;

    @Value("${egov.esign.location.endpoint}")
    private String esignLocationEndPoint;

    @Value("${dristi.esign.signature.width:250}")
    private int esignSignatureWidth;

    @Value("${dristi.esign.signature.height:50}")
    private int esignSignatureHeight;

    @Value("${file.max.size:10485760}")
    private long maxFileSize;

    @Value("${allowed.content.types:application/pdf}")
    private String[] allowedContentTypes;

    // Filestore additional endpoints
    @Value("${egov.filestore.search.endpoint}")
    private String fileStoreSearchEndpoint;

    @Value("${egov.filestore.save.endpoint}")
    private String fileStoreSaveEndPoint;

    // Egov PDF Config
    @Value("${egov.dristi.pdf.host}")
    private String egovPdfHost;

    @Value("${egov.dristi.pdf.ctc}")
    private String egovPdfCtcEndpoint;

}
