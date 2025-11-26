package digit.service;

import digit.enrichment.MediationEnrichment;
import digit.validators.MediationDocumentValidator;
import digit.web.models.DigitalizedDocument;
import digit.web.models.DigitalizedDocumentRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Service for processing MEDIATION type documents
 */
@Service
@Slf4j
public class MediationDocumentService implements DocumentTypeService {

    private final MediationDocumentValidator validator;

    private final MediationEnrichment enrichment;

    @Autowired
    public MediationDocumentService(MediationDocumentValidator validator, MediationEnrichment enrichment) {
        this.validator = validator;
        this.enrichment = enrichment;
    }

    @Override
    public DigitalizedDocument createDocument(DigitalizedDocumentRequest documentRequest) {

        log.info("operation = processDocument ,  result = IN_PROGRESS");

        DigitalizedDocument document = documentRequest.getDigitalizedDocument();

        validator.validateCreateMediationDocument(document);

        enrichment.enrichCreateMediationDocument(documentRequest);



        log.info("operation = processDocument ,  result = SUCCESS");
        return document;
    }

    @Override
    public DigitalizedDocument updateDocument(DigitalizedDocumentRequest digitalizedDocumentRequest) {
        return null;
    }
}
