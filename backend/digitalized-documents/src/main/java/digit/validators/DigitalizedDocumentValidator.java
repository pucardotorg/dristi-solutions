package digit.validators;

import digit.web.models.DigitalizedDocument;
import org.egov.tracer.model.CustomException;

/**
 * Interface for document validation based on document type
 */
public interface DigitalizedDocumentValidator {

    /**
     * Validates the digitalized document based on its type
     *
     * @param document The document to validate
     * @throws CustomException if validation fails
     */
    void validate(DigitalizedDocument document);

}
