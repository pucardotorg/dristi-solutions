package digit.validators;

import digit.web.models.DigitalizedDocument;
import digit.web.models.MediationDetails;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

import static digit.config.ServiceConstants.INVALID_MEDIATION_DETAILS;
import static digit.config.ServiceConstants.INVALID_ORDER_NUMBER;

@Component
@Slf4j
public class MediationDocumentValidator {

    public void validateCreateMediationDocument(DigitalizedDocument document) {

        if (document == null) {
            throw new CustomException(INVALID_MEDIATION_DETAILS, "Document cannot be null");
        }

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
    }

    private void validateNotNull(Object field, String errorCode, String message) {
        if (field == null) {
            throw new CustomException(errorCode, message);
        }
    }
}
