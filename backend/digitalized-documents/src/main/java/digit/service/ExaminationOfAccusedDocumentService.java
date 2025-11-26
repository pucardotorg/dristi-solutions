package digit.service;

import digit.web.models.DigitalizedDocument;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;

/**
 * Service for processing EXAMINATION_OF_ACCUSED type documents
 */
@Service
@Slf4j
public class ExaminationOfAccusedDocumentService implements DocumentTypeService {

    @Override
    public DigitalizedDocument createDocument(DigitalizedDocument document) {
        return null;
    }

    @Override
    public DigitalizedDocument updateDocument(DigitalizedDocument document) {
        return null;
    }
}
