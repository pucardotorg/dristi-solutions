package digit.service;

import digit.web.models.TypeEnum;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

import static digit.config.ServiceConstants.INVALID_DOCUMENT_TYPE;
import static digit.config.ServiceConstants.SERVICE_NOT_FOUND;

/**
 * Factory class to get the appropriate service based on document type
 */
@Component
@Slf4j
public class DocumentTypeServiceFactory {

    private final Map<TypeEnum, DocumentTypeService> services = new HashMap<>();

    @Autowired
    public DocumentTypeServiceFactory(
            PleaDocumentService pleaDocumentService,
            ExaminationOfAccusedDocumentService examinationOfAccusedDocumentService,
            MediationDocumentService mediationDocumentService) {

        services.put(TypeEnum.PLEA, pleaDocumentService);
        services.put(TypeEnum.EXAMINATION_OF_ACCUSED, examinationOfAccusedDocumentService);
        services.put(TypeEnum.MEDIATION, mediationDocumentService);

        log.info("DocumentTypeServiceFactory initialized with {} services", services.size());
    }

    /**
     * Get the appropriate service for the given document type
     *
     * @param type The document type
     * @return The service for the given type
     * @throws CustomException if no service found for the type
     */
    public DocumentTypeService getService(TypeEnum type) {
        if (type == null) {
            throw new CustomException(INVALID_DOCUMENT_TYPE, "Document type cannot be null");
        }

        DocumentTypeService service = services.get(type);

        if (service == null) {
            throw new CustomException(SERVICE_NOT_FOUND, "No service found for document type: " + type);
        }

        log.info("Retrieved service for type: {}", type);
        return service;
    }
}
