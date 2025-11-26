package digit.service;

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

    @Override
    public DigitalizedDocument createDocument(DigitalizedDocumentRequest digitalizedDocumentRequest) {
        return null;
    }

    @Override
    public DigitalizedDocument updateDocument(DigitalizedDocumentRequest digitalizedDocumentRequest) {
        return null;
    }
}
