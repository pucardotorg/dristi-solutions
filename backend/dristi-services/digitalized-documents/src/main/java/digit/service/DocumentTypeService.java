package digit.service;

import digit.web.models.DigitalizedDocument;
import digit.web.models.DigitalizedDocumentRequest;
import org.egov.tracer.model.CustomException;

/**
 * Interface for type-specific document operations
 */
public interface DocumentTypeService {

    /**
     * Processes and validates a digitalized document based on its type
     *
     * @param request The document to process
     * @return Processed document
     * @throws CustomException if validation or processing fails
     */
    DigitalizedDocument createDocument(DigitalizedDocumentRequest request);

    /**
     * Updates and validates a digitalized document based on its type
     *
     * @param request The document to update
     * @return Updated document
     * @throws CustomException if validation or updating fails
     */
    DigitalizedDocument updateDocument(DigitalizedDocumentRequest request);

}
