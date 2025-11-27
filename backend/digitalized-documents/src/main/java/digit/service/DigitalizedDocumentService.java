package digit.service;

import digit.web.models.DigitalizedDocument;
import digit.web.models.DigitalizedDocumentRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import static digit.config.ServiceConstants.CREATE_DIGITALIZED_DOCUMENT_FAILED;
import static digit.config.ServiceConstants.UPDATE_DIGITALIZED_DOCUMENT_FAILED;

@Service
@Slf4j
public class DigitalizedDocumentService {

    private final DocumentTypeServiceFactory serviceFactory;

    @Autowired
    public DigitalizedDocumentService(DocumentTypeServiceFactory serviceFactory) {
        this.serviceFactory = serviceFactory;
    }

    public DigitalizedDocument createDigitalizedDocument(DigitalizedDocumentRequest digitalizedDocumentRequest) {
        try {

            log.info("operation = createDigitalizedDocument ,  result = IN_PROGRESS");

            DigitalizedDocument document = digitalizedDocumentRequest.getDigitalizedDocument();

            // Process document using appropriate service based on type
            log.info("Processing digitalized document with type: {}", document.getType());

            DocumentTypeService documentTypeService = serviceFactory.getService(document.getType());

            log.info("operation = createDigitalizedDocument ,  result = SUCCESS");

            return documentTypeService.createDocument(digitalizedDocumentRequest);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error processing create digitalized document: {}", e.getMessage());
            throw new CustomException(CREATE_DIGITALIZED_DOCUMENT_FAILED, "Error while creating digitalized document : " + e.getMessage());
        }
    }

    public DigitalizedDocument updateDigitalizedDocument(DigitalizedDocumentRequest digitalizedDocumentRequest) {
        try {

            log.info("operation = updateDigitalizedDocument ,  result = IN_PROGRESS");

            DigitalizedDocument document = digitalizedDocumentRequest.getDigitalizedDocument();

            DocumentTypeService documentTypeService = serviceFactory.getService(document.getType());

            log.info("operation = updateDigitalizedDocument ,  result = SUCCESS");

            return documentTypeService.updateDocument(digitalizedDocumentRequest);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error processing update digitalized document: {}", e.getMessage());
            throw new CustomException(UPDATE_DIGITALIZED_DOCUMENT_FAILED, "Error while updating digitalized document : " + e.getMessage());
        }
    }
}
