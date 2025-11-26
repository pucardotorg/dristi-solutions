package digit.service;

import digit.web.models.DigitalizedDocument;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;

/**
 * Service for processing MEDIATION type documents
 */
@Service
@Slf4j
public class MediationDocumentService implements DocumentTypeService {

    @Override
    public DigitalizedDocument createDocument(DigitalizedDocument document) {
        log.info("operation = processDocument ,  result = IN_PROGRESS");

        log.info("operation = processDocument ,  result = SUCCESS");
        return document;
    }

    @Override
    public DigitalizedDocument updateDocument(DigitalizedDocument document) {
        return null;
    }
}
