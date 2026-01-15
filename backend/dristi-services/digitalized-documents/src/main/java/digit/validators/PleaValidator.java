package digit.validators;

import digit.repository.DigitalizedDocumentRepository;
import digit.web.models.DigitalizedDocument;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

import static digit.config.ServiceConstants.VALIDATION_ERROR;


@Component
@Slf4j
public class PleaValidator {

    private final DigitalizedDocumentRepository digitalizedDocumentRepository;

    public PleaValidator(DigitalizedDocumentRepository digitalizedDocumentRepository) {
        this.digitalizedDocumentRepository = digitalizedDocumentRepository;
    }

    public DigitalizedDocument validateDigitalizedDocument(DigitalizedDocument document) {
        String documentNumber = document.getDocumentNumber();
        DigitalizedDocument existingDocument = digitalizedDocumentRepository.getDigitalizedDocumentByDocumentNumber(documentNumber, document.getTenantId());

        if(existingDocument == null){
            throw new CustomException(VALIDATION_ERROR, "Digitalized document with document number " + documentNumber + " does not exist");
        }

        return existingDocument;
    }

}