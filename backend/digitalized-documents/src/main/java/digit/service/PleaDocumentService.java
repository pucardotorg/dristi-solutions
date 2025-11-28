package digit.service;

import digit.config.Configuration;
import digit.enrichment.DigitalizedDocumentEnrichment;
import digit.enrichment.PleaEnrichment;
import digit.kafka.Producer;
import digit.validators.PleaValidator;
import digit.web.models.DigitalizedDocument;
import digit.web.models.DigitalizedDocumentRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for processing PLEA type documents
 */
@Service
@Slf4j
public class PleaDocumentService implements DocumentTypeService {

    private final PleaValidator validator;
    private final DigitalizedDocumentEnrichment enrichment;
    private final PleaEnrichment pleaEnrichment;
    private final WorkflowService workflowService;
    private final Producer producer;
    private final Configuration config;

    public PleaDocumentService(PleaValidator validator, DigitalizedDocumentEnrichment enrichment, PleaEnrichment pleaEnrichment, WorkflowService workflowService, Producer producer, Configuration config) {
        this.validator = validator;
        this.enrichment = enrichment;
        this.pleaEnrichment = pleaEnrichment;
        this.workflowService = workflowService;
        this.producer = producer;
        this.config = config;
    }

    @Override
    public DigitalizedDocument createDocument(DigitalizedDocumentRequest request) {

        enrichment.enrichDigitalizedDocument(request);

        pleaEnrichment.enrichDocumentOnCreation(request);

        workflowService.updateWorkflowStatus(request);

        producer.push(config.getPleaDigitalizedDocumentCreateTopic(), request);

        return request.getDigitalizedDocument();
    }

    @Override
    public DigitalizedDocument updateDocument(DigitalizedDocumentRequest request) {
        validator.validateDigitalizedDocument(request.getDigitalizedDocument());

        pleaEnrichment.enrichDocumentOnUpdate(request);

        workflowService.updateWorkflowStatus(request);

        producer.push(config.getPleaDigitalizedDocumentUpdateTopic(), request);

        return request.getDigitalizedDocument();
    }
}
