package digit.validators;

import digit.web.models.TypeEnum;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Factory class to get the appropriate validator based on document type
 */
@Component
@Slf4j
public class DigitalizedDocumentValidatorFactory {

    private final Map<TypeEnum, DigitalizedDocumentValidator> validators = new HashMap<>();

    @Autowired
    public DigitalizedDocumentValidatorFactory(
            PleaValidator pleaValidator,
            ExaminationOfAccusedValidator examinationOfAccusedValidator,
            MediationValidator mediationValidator) {

        validators.put(TypeEnum.PLEA, pleaValidator);
        validators.put(TypeEnum.EXAMINATION_OF_ACCUSED, examinationOfAccusedValidator);
        validators.put(TypeEnum.MEDIATION, mediationValidator);

        log.info("DigitalizedDocumentValidatorFactory initialized with {} validators", validators.size());
    }

    /**
     * Get the appropriate validator for the given document type
     *
     * @param type The document type
     * @return The validator for the given type
     * @throws CustomException if no validator found for the type
     */
    public DigitalizedDocumentValidator getValidator(TypeEnum type) {
        if (type == null) {
            throw new CustomException("INVALID_DOCUMENT_TYPE", "Document type cannot be null");
        }

        DigitalizedDocumentValidator validator = validators.get(type);

        if (validator == null) {
            throw new CustomException("VALIDATOR_NOT_FOUND", "No validator found for document type: " + type);
        }

        log.info("Retrieved validator for type: {}", type);
        return validator;
    }
}
