package digit.service;

import digit.validators.DigitalizedDocumentValidator;
import digit.validators.DigitalizedDocumentValidatorFactory;
import digit.web.models.DigitalizedDocument;
import digit.web.models.DigitalizedDocumentRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class DigitalizedDocumentService {

    private final DigitalizedDocumentValidatorFactory validatorFactory;

    @Autowired
    public DigitalizedDocumentService(DigitalizedDocumentValidatorFactory validatorFactory) {
        this.validatorFactory = validatorFactory;
    }

    public DigitalizedDocument createDigitalizedDocument(DigitalizedDocumentRequest digitalizedDocumentRequest) {
        DigitalizedDocument document = digitalizedDocumentRequest.getDigitalizedDocument();

        // Validate document using appropriate validator based on type
        log.info("Validating digitalized document with type: {}", document.getType());

        DigitalizedDocumentValidator digitalizedDocumentValidator = validatorFactory.getValidator(document.getType());

        digitalizedDocumentValidator.validate(document);

        return document;
    }
}
