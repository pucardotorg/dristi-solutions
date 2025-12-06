package digit.validators;

import digit.repository.DigitalizedDocumentRepository;
import digit.web.models.DigitalizedDocument;
import digit.web.models.DigitalizedDocumentRequest;
import digit.web.models.ExaminationOfAccusedDetails;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

import static digit.config.ServiceConstants.VALIDATION_ERROR;


@Component
@Slf4j
public class ExaminationOfAccusedValidator {

    private final DigitalizedDocumentRepository digitalizedDocumentRepository;

    public ExaminationOfAccusedValidator(DigitalizedDocumentRepository digitalizedDocumentRepository) {
        this.digitalizedDocumentRepository = digitalizedDocumentRepository;
    }

    public void validateDigitalizedDocument(DigitalizedDocumentRequest request) {
        DigitalizedDocument digitalizedDocument = request.getDigitalizedDocument();

        validateNotNull(digitalizedDocument, "Digitalized document");
        validateNotNull(digitalizedDocument.getTenantId(), "Tenant ID");

        ExaminationOfAccusedDetails examinationOfAccusedDetails = digitalizedDocument.getExaminationOfAccusedDetails();

        validateNotNull(examinationOfAccusedDetails, "Examination of Accused Details");
        validateNotNull(examinationOfAccusedDetails.getAccusedUniqueId(), "Accused unique id");

    }

    private void validateNotNull(Object field, String fieldName) {
        if (field == null) {
            throw new CustomException(VALIDATION_ERROR, fieldName + " cannot be null");
        }
    }

    public DigitalizedDocument checkDigitalizedDocumentExists(DigitalizedDocument document){

        String documentNumber = document.getDocumentNumber();
        DigitalizedDocument existingDocument = digitalizedDocumentRepository.getDigitalizedDocumentByDocumentNumber(documentNumber, document.getTenantId());

        if(existingDocument == null){
            throw new CustomException(VALIDATION_ERROR, "Digitalized document with document number " + documentNumber + " does not exist");
        }

        return existingDocument;
    }

}
