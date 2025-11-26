package digit.service;

import digit.web.models.DigitalizedDocument;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;

/**
 * Service for processing PLEA type documents
 */
@Service
@Slf4j
public class PleaDocumentService implements DocumentTypeService {

    @Override
    public DigitalizedDocument createDocument(DigitalizedDocument document) {
        return null;
    }

    @Override
    public DigitalizedDocument updateDocument(DigitalizedDocument document) {
        return null;
    }
}
