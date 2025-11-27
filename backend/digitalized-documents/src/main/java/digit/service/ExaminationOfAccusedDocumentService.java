package digit.service;

import digit.config.Configuration;
import digit.enrichment.DigitalizedDocumentEnrichment;
import digit.enrichment.ExaminationOfAccusedEnrichment;
import digit.kafka.Producer;
import digit.validator.ExaminationOfAccusedValidator;
import digit.web.models.DigitalizedDocument;
import digit.web.models.DigitalizedDocumentRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for processing EXAMINATION_OF_ACCUSED type documents
 */
@Service
@Slf4j
public class ExaminationOfAccusedDocumentService implements DocumentTypeService {

    private final ExaminationOfAccusedValidator validator;
    private final DigitalizedDocumentEnrichment enrichment;
    private final ExaminationOfAccusedEnrichment examinationOfAccusedEnrichment;
    private final WorkflowService workflowService;
    private final Producer producer;
    private final Configuration config;

    public ExaminationOfAccusedDocumentService(ExaminationOfAccusedValidator validator, DigitalizedDocumentEnrichment enrichment, ExaminationOfAccusedEnrichment examinationOfAccusedEnrichment, WorkflowService workflowService, Producer producer, Configuration config) {
        this.validator = validator;
        this.enrichment = enrichment;
        this.examinationOfAccusedEnrichment = examinationOfAccusedEnrichment;
        this.workflowService = workflowService;
        this.producer = producer;
        this.config = config;
    }

    @Override
    public DigitalizedDocument createDocument(DigitalizedDocumentRequest request) {

        validator.validateDigitalizedDocument(request);

        enrichment.enrichDigitalizedDocument(request);

        examinationOfAccusedEnrichment.enrichDocumentOnCreation(request);

        workflowService.updateWorkflowStatus(request);

        producer.push(config.getExaminationOfAccusedCreateTopic(), request);

        return request.getDigitalizedDocument();

    }

    @Override
    public DigitalizedDocument updateDocument(DigitalizedDocumentRequest request) {
        validator.validateDigitalizedDocument(request);

        validator.checkDigitalizedDocumentExists(request.getDigitalizedDocument());

        examinationOfAccusedEnrichment.enrichDocumentOnUpdate(request);

        examinationOfAccusedEnrichment.enrichDocumentOnUpdate(request);

        workflowService.updateWorkflowStatus(request);

        producer.push(config.getExaminationOfAccusedUpdateTopic(), request);

        return request.getDigitalizedDocument();
    }
}
