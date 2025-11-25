package digit.validators;

import digit.web.models.DigitalizedDocument;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

/**
 * Validator for PLEA type documents
 */
@Component
@Slf4j
public class PleaValidator implements DigitalizedDocumentValidator {

    @Override
    public void validate(DigitalizedDocument document) {
        log.info("Validating PLEA document: {}", document.getId());

        if (document.getPleaDetails() == null) {
            throw new CustomException("PLEA_DETAILS_MISSING",
                    "Plea details are required for PLEA type documents");
        }

        // Add specific validation for plea details
        validatePleaDetails(document);
    }

    private void validatePleaDetails(DigitalizedDocument document) {
        // Add your specific plea validation logic here
        log.info("Validating plea details for document: {}", document.getId());

        // Example validations:
        // - Check required fields in pleaDetails
        // - Validate data formats
        // - Business rule validations
    }
}
