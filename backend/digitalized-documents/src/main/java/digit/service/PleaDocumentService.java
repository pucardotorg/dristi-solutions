package digit.service;

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

    @Override
    public DigitalizedDocument createDocument(DigitalizedDocumentRequest document) {
        return null;
    }

    @Override
    public DigitalizedDocument updateDocument(DigitalizedDocumentRequest document) {
        return null;
    }
}
