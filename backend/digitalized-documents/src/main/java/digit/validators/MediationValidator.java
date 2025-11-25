package digit.validators;

import digit.web.models.DigitalizedDocument;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

/**
 * Validator for MEDIATION type documents
 */
@Component
@Slf4j
public class MediationValidator implements DigitalizedDocumentValidator {

    @Override
    public void validate(DigitalizedDocument document) {
        log.info("Validating MEDIATION document");
        
        if (document.getMediationDetails() == null) {
            throw new CustomException("MEDIATION_DETAILS_MISSING", "Mediation details are required for MEDIATION type documents");
        }
        
        // Add specific validation for mediation details
        validateMediationDetails(document);
    }
    
    private void validateMediationDetails(DigitalizedDocument document) {
        // Add your specific mediation validation logic here
        log.info("Validating mediation details for document: {}", document.getId());
        
        // Example validations:
        // - Check required fields in mediationDetails
        // - Validate data formats
        // - Business rule validations
    }
}
