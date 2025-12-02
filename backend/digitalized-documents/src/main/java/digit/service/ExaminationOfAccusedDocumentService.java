package digit.service;

import digit.config.Configuration;
import digit.enrichment.DigitalizedDocumentEnrichment;
import digit.enrichment.ExaminationOfAccusedEnrichment;
import digit.kafka.Producer;
import digit.util.FileStoreUtil;
import digit.validators.ExaminationOfAccusedValidator;
import digit.validators.MediationDocumentValidator;
import digit.web.models.DigitalizedDocument;
import digit.web.models.DigitalizedDocumentRequest;
import digit.web.models.Document;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for processing EXAMINATION_OF_ACCUSED type documents
 */
@Service
@Slf4j
public class ExaminationOfAccusedDocumentService implements DocumentTypeService {

    private final ExaminationOfAccusedValidator validator;
    private final DigitalizedDocumentEnrichment enrichment;
    private final ExaminationOfAccusedEnrichment examinationOfAccusedEnrichment;
    private final WorkflowService workflowService;
    private final Producer producer;
    private final Configuration config;
    private final FileStoreUtil fileStoreUtil;

    public ExaminationOfAccusedDocumentService(ExaminationOfAccusedValidator validator, DigitalizedDocumentEnrichment enrichment, ExaminationOfAccusedEnrichment examinationOfAccusedEnrichment, WorkflowService workflowService, Producer producer, Configuration config, FileStoreUtil fileStoreUtil) {
        this.validator = validator;
        this.enrichment = enrichment;
        this.examinationOfAccusedEnrichment = examinationOfAccusedEnrichment;
        this.workflowService = workflowService;
        this.producer = producer;
        this.config = config;
        this.fileStoreUtil = fileStoreUtil;
    }

    @Override
    public DigitalizedDocument createDocument(DigitalizedDocumentRequest request) {

        validator.validateDigitalizedDocument(request);

        enrichment.enrichDigitalizedDocument(request);

        examinationOfAccusedEnrichment.enrichDocumentOnCreation(request);

        workflowService.updateWorkflowStatus(request);

        producer.push(config.getExaminationOfAccusedCreateTopic(), request);

        return request.getDigitalizedDocument();

    }

    @Override
    public DigitalizedDocument updateDocument(DigitalizedDocumentRequest request) {
        validator.validateDigitalizedDocument(request);

        DigitalizedDocument existingDocument = validator.checkDigitalizedDocumentExists(request.getDigitalizedDocument());

        examinationOfAccusedEnrichment.enrichDocumentOnUpdate(request);

        examinationOfAccusedEnrichment.enrichDocumentOnUpdate(request);

        workflowService.updateWorkflowStatus(request);

        List<String> fileStoreIdsToDelete = extractInactiveFileStoreIds(request,existingDocument);

        if (!fileStoreIdsToDelete.isEmpty()) {
            fileStoreUtil.deleteFilesByFileStore(fileStoreIdsToDelete, request.getDigitalizedDocument().getTenantId());
            log.info("Deleted files for ids: {}", fileStoreIdsToDelete);
        }

        producer.push(config.getExaminationOfAccusedUpdateTopic(), request);

        return request.getDigitalizedDocument();
    }

    public List<String> extractInactiveFileStoreIds(
            DigitalizedDocumentRequest digitalizedDocumentRequest,
            DigitalizedDocument existingDocument) {

        List<String> inactiveFileStoreIds = new ArrayList<>();

        DigitalizedDocument updatedDocument = digitalizedDocumentRequest.getDigitalizedDocument();

        // Collect filestoreIds present in updated document
        Set<String> updatedFileStores = new HashSet<>();
        if (updatedDocument.getDocuments() != null) {
            updatedDocument.getDocuments().stream()
                    .filter(Objects::nonNull)
                    .map(Document::getFileStore)
                    .filter(Objects::nonNull)
                    .forEach(updatedFileStores::add);
        }

        // Compare with existing document → extract filestores missing from updatedDocument
        if (existingDocument.getDocuments() != null) {
            existingDocument.getDocuments().stream()
                    .filter(Objects::nonNull)
                    .map(Document::getFileStore)
                    .filter(Objects::nonNull)
                    .filter(fs -> !updatedFileStores.contains(fs))   // filestore removed in updated payload
                    .forEach(inactiveFileStoreIds::add);
        }

        return inactiveFileStoreIds;
    }

}
