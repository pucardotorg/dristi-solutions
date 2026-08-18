package digit.validators;

import digit.repository.DigitalizedDocumentRepository;
import digit.web.models.DigitalizedDocument;
import digit.web.models.MediationDetails;
import digit.web.models.MediationPartyDetails;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

import static digit.config.ServiceConstants.*;

@Component
@Slf4j
public class MediationDocumentValidator {

    private final DigitalizedDocumentRepository digitalizedDocumentRepository;

    public MediationDocumentValidator(DigitalizedDocumentRepository digitalizedDocumentRepository) {
        this.digitalizedDocumentRepository = digitalizedDocumentRepository;
    }

    public void validateCreateMediationDocument(DigitalizedDocument document) {

        validateNotNull(document.getOrderNumber(), INVALID_ORDER_NUMBER, "Order number cannot be null");

        MediationDetails details = document.getMediationDetails();

        validateNotNull(details, INVALID_MEDIATION_DETAILS, "Mediation details cannot be null");

        validateNotNull(details.getNatureOfComplainant(),
                INVALID_MEDIATION_DETAILS, "Nature of complainant cannot be null");

        validateNotNull(details.getDateOfInstitution(),
                INVALID_MEDIATION_DETAILS, "Date of institution cannot be null");

        validateNotNull(details.getCaseStage(),
                INVALID_MEDIATION_DETAILS, "Case stage cannot be null");

        validateNotNull(details.getHearingDate(),
                INVALID_MEDIATION_DETAILS, "Hearing date cannot be null");

        validateNotNull(details.getPartyDetails(),
                INVALID_MEDIATION_DETAILS, "Party details cannot be null");

        for (MediationPartyDetails partyDetails : details.getPartyDetails()) {
            validateNotNull(partyDetails.getPartyType(),
                    INVALID_MEDIATION_DETAILS, "Party type cannot be null");
            validateNotNull(partyDetails.getUniqueId(),
                    INVALID_MEDIATION_DETAILS, "Unique id cannot be null");
            validateNotNull(partyDetails.getMobileNumber(),
                    INVALID_MEDIATION_DETAILS, "Mobile number cannot be null");
            validateNotNull(partyDetails.getPartyName(),
                    INVALID_MEDIATION_DETAILS, "Party name cannot be null");
            validateNotNull(partyDetails.getPartyIndex(),
                    INVALID_MEDIATION_DETAILS, "Party index cannot be null");
            validateNotNull(partyDetails.getHasSigned(),
                    INVALID_MEDIATION_DETAILS, "Has signed cannot be null");
        }
    }

    public DigitalizedDocument validateUpdateMediationDocument(DigitalizedDocument document) {

        validateNotNull(document, INVALID_MEDIATION_DETAILS, "Document cannot be null");

        validateNotNull(document.getId(), INVALID_MEDIATION_DETAILS, "Id cannot be null");

        validateNotNull(document.getDocumentNumber(), INVALID_MEDIATION_DETAILS, "Document number cannot be null");

        validateNotNull(document.getOrderNumber(), INVALID_ORDER_NUMBER, "Order number cannot be null");

        String documentNumber = document.getDocumentNumber();
        DigitalizedDocument existingDocument = digitalizedDocumentRepository.getDigitalizedDocumentByDocumentNumber(documentNumber, document.getTenantId());

        if(existingDocument == null){
            throw new CustomException(VALIDATION_ERROR, "Digitalized document with document number " + documentNumber + " does not exist");
        }

        return existingDocument;
    }

    private void validateNotNull(Object field, String errorCode, String message) {
        if (field == null) {
            throw new CustomException(errorCode, message);
        }
    }
}
