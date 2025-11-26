package digit.service;

import digit.web.models.DigitalizedDocument;
import org.egov.tracer.model.CustomException;

/**
 * Interface for type-specific document operations
 */
public interface DocumentTypeService {

    /**
     * Processes and validates a digitalized document based on its type
     *
     * @param document The document to process
     * @return Processed document
     * @throws CustomException if validation or processing fails
     */
    DigitalizedDocument createDocument(DigitalizedDocument document);

    /**
     * Updates and validates a digitalized document based on its type
     *
     * @param document The document to update
     * @return Updated document
     * @throws CustomException if validation or updating fails
     */
    DigitalizedDocument updateDocument(DigitalizedDocument document);

}
